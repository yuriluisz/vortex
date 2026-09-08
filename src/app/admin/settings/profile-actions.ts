"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, createSession, deleteSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { generateOTP, storeOTP, verifyOTP, sendOTPEmail } from "@/lib/auth";
import type { Plan } from "@/lib/prisma-types";
import { Prisma } from "@prisma/client";
import type { ActionState } from "./actions";
import { uploadImageToR2, deleteFileFromR2 } from "@/lib/r2";
import { validateImageBuffer } from "@/lib/image-validator";

// ============================================================================
// SEGURANÇA: Lista de nomes reservados (bloqueia variações de "vortex")
// ============================================================================

const RESERVED_NAMES = [
  // Exatas
  "vortex", "vortexpages", "vortex-pages", "vortex_pages",
  "vortexplus", "vortex_plus",
  // Com números
  "vortex1", "vortex2", "vortex3", "vortexapp", "vortexapp",
  "vortexpages1", "vortexpages2",
  // Variações com caracteres especiais/acentos
  "vórtex", "vórTEX", "v0rtex", "v0rt3x", "vort3x",
  "vortexbr", "vortexbrasil", "vortexbr",
  "myvortex", "meuvortex", "seuvortex",
];

/**
 * Verifica se um nome/slug contém variações reservadas de "vortex".
 * Apenas o admin (yulusica@gmail.com) pode usar esses nomes.
 */
function isReservedName(name: string, email: string): boolean {
  const normalized = name.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase() || process.env.ADMIN_ALERT_EMAIL?.toLowerCase();

  // Admin configurado pode usar qualquer nome reservado
  if (adminEmail && email.toLowerCase() === adminEmail) return false;

  // Verifica correspondência exata ou parcial
  for (const reserved of RESERVED_NAMES) {
    const reservedNormalized = reserved.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (normalized === reservedNormalized || normalized.includes(reservedNormalized) || reservedNormalized.includes(normalized)) {
      return true;
    }
  }

  // Regex para capturar variações criativas (v0rtex, vort3x, etc.)
  const vortexRegex = /^v[o0òóõ]r[t7]e?[x×]?[a-z0-9]*$/i;
  if (vortexRegex.test(normalized.replace(/[^a-z0-9]/g, ""))) {
    return true;
  }

  return false;
}

// ============================================================================
// SEGURANÇA: Validação de sessão reutilizável
// ============================================================================
async function requireAuth() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    throw new Error("Não autorizado.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { id: true, name: true, slug: true, plan: true },
  });

  if (!tenant) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  return {
    userId: session.userId,
    email: session.email,
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    plan: tenant.plan as Plan,
    role: session.role,
  };
}

// ============================================================================
// SCHEMAS
// ============================================================================

const ProfileSchema = z.object({
  companyName: z.string().min(1, "O nome da empresa é obrigatório"),
  slug: z
    .string()
    .min(1, "O subdomínio é obrigatório")
    .transform((val) => val.toLowerCase().replace(/\s+/g, "-"))
    .refine(
      (val) => /^[a-z0-9-]+$/.test(val),
      "O subdomínio deve conter apenas letras minúsculas, números e hífens"
    ),
});

const PublicProfileSchema = z.object({
  displayName: z.string().min(1, "O nome de exibição é obrigatório").max(60),
  handle: z
    .string()
    .min(1, "O handle é obrigatório")
    .max(40)
    .transform((val) => val.toLowerCase().replace(/^@/, "").replace(/\s+/g, "-"))
    .refine((val) => /^[a-z0-9-]+$/.test(val), "O handle deve conter apenas letras minúsculas, números e hífens"),
  bio: z.string().max(500).optional(),
  publicProfile: z.boolean().optional(),
  profileWebsite: z
    .string()
    .url("URL inválida")
    .refine((v) => !v || /^https?:\/\//i.test(v), "A URL deve iniciar com http:// ou https://")
    .optional()
    .or(z.literal("")),
  profileInstagram: z
    .string()
    .url("URL inválida")
    .refine((v) => !v || /^https?:\/\//i.test(v), "A URL deve iniciar com http:// ou https://")
    .optional()
    .or(z.literal("")),
  profileYoutube: z
    .string()
    .url("URL inválida")
    .refine((v) => !v || /^https?:\/\//i.test(v), "A URL deve iniciar com http:// ou https://")
    .optional()
    .or(z.literal("")),
  profileWhatsapp: z
    .string()
    .optional()
    .or(z.literal("")),
});

const EmailChangeSchema = z.object({
  newEmail: z.string().email("E-mail inválido"),
});

const VerifyEmailSchema = z.object({
  newEmail: z.string().email("E-mail inválido"),
  otp: z.string().length(6, "O código deve ter 6 dígitos"),
});

// ============================================================================
// ACTIONS
// ============================================================================

export async function updateProfileAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId, tenantId, tenantSlug, email, role, plan } = await requireAuth();

  if (role === "MEMBER") {
    return { error: "Apenas administradores podem alterar os dados da empresa." };
  }

  const parsed = ProfileSchema.safeParse({
    companyName: formData.get("companyName"),
    slug: formData.get("slug"),
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { companyName, slug } = parsed.data;

  if (isReservedName(companyName, email)) {
    return { error: "Este nome está reservado. Escolha outro." };
  }

  if (slug !== tenantSlug) {
    const existing = await prisma.tenant.findUnique({ where: { slug } });
    if (existing) {
      return { error: "Este subdomínio já está em uso." };
    }
  }

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { name: companyName, slug },
    });

    await deleteSession();
    await createSession(userId, email, tenantId, slug, plan, role);

    await logAudit("TENANT_UPDATED", { name: companyName, slug }, userId, tenantId);
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao atualizar dados da empresa." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updateCombinedSettingsAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profileResult = await updateProfileAction(state, formData);
  if (profileResult?.error) return profileResult;

  const publicResult = await updatePublicProfileAction(state, formData);
  if (publicResult?.error) return publicResult;

  const userName = formData.get("userName") as string | null;
  if (userName?.trim()) {
    const { userId } = await requireAuth();
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { name: userName.trim() },
      });
    } catch (err) {
      console.error("[updateCombinedSettingsAction] Erro ao salvar nome:", err);
    }
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function updatePublicProfileAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId } = await requireAuth();

  const parsed = PublicProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    handle: formData.get("handle"),
    bio: formData.get("bio") || undefined,
    publicProfile: formData.get("publicProfile") === "on",
    profileWebsite: formData.get("profileWebsite") || "",
    profileInstagram: formData.get("profileInstagram") || "",
    profileYoutube: formData.get("profileYoutube") || "",
    profileWhatsapp: formData.get("profileWhatsapp") || "",
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { displayName, handle, bio, publicProfile, ...links } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { handle, id: { not: userId } },
    select: { id: true },
  });
  if (existing) {
    return { error: "Este handle já está em uso. Escolha outro." };
  }

  const profileLinks: Record<string, string> = {};
  if (links.profileWebsite) profileLinks.website = links.profileWebsite;
  if (links.profileInstagram) profileLinks.instagram = links.profileInstagram;
  if (links.profileYoutube) profileLinks.youtube = links.profileYoutube;
  if (links.profileWhatsapp) profileLinks.whatsapp = links.profileWhatsapp;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        displayName,
        handle,
        bio: bio || null,
        publicProfile,
        profileLinks: Object.keys(profileLinks).length > 0 ? profileLinks : Prisma.JsonNull,
      },
    });

    await logAudit("PROFILE_UPDATED", { handle, publicProfile }, userId);
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar perfil público." };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/community/[handle]", "page");
  return { success: true };
}

export async function requestEmailChangeAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { email: currentEmail } = await requireAuth();

  const parsed = EmailChangeSchema.safeParse({
    newEmail: formData.get("newEmail"),
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { newEmail } = parsed.data;
  const normalizedEmail = newEmail.toLowerCase();

  if (normalizedEmail === currentEmail.toLowerCase()) {
    return { error: "O novo email deve ser diferente do atual." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    return { error: "Este email já está em uso por outra conta." };
  }

  const ip = (await headers()).get("cf-connecting-ip") || (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateKey = `email_change:${ip}`;
  const rateResult = await rateLimit(rateKey, RATE_LIMITS.OTP);
  if (!rateResult.allowed) {
    return { error: "Muitas tentativas. Aguarde antes de tentar novamente." };
  }

  const otp = generateOTP();
  await storeOTP(`email_change:${normalizedEmail}`, otp);

  const emailResult = await sendOTPEmail(normalizedEmail, otp);
  if (!emailResult.success) {
    return { error: emailResult.error || "Falha ao enviar e-mail." };
  }

  return { success: true };
}

export async function verifyEmailChangeAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { userId, tenantId, role, plan, tenantSlug } = await requireAuth();

  const parsed = VerifyEmailSchema.safeParse({
    newEmail: formData.get("newEmail"),
    otp: formData.get("otp"),
  });

  if (!parsed.success) {
    return {
      error: "Verifique os erros no formulário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { newEmail, otp } = parsed.data;
  const normalizedEmail = newEmail.toLowerCase();

  try {
    const isValid = await verifyOTP(`email_change:${normalizedEmail}`, otp);
    if (!isValid) {
      return { error: "Código inválido ou expirado." };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro ao verificar código.",
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { email: normalizedEmail },
    });

    await deleteSession();
    await createSession(userId, normalizedEmail, tenantId, tenantSlug, plan, role);

    await logAudit("EMAIL_CHANGED", { newEmail: normalizedEmail }, userId, tenantId);
  } catch (error) {
    console.error(error);
    return { error: "Erro interno ao atualizar email." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function uploadAvatarAction(
  _state: ActionState,
  formData: FormData
): Promise<ActionState & { avatarUrl?: string }> {
  const { userId, tenantId } = await requireAuth();

  const rateKey = `upload_avatar:${userId}`;
  const rateResult = await rateLimit(rateKey, RATE_LIMITS.AVATAR_UPLOAD);
  if (!rateResult.allowed) {
    return { error: "Muitas tentativas de upload. Aguarde um minuto." };
  }

  const file = formData.get("avatar") as File | null;
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: "Nenhum arquivo de imagem foi enviado." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "A imagem deve ter no máximo 5MB." };
  }

  const validTypes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  if (!validTypes[file.type]) {
    return { error: "Formato de imagem inválido. Use JPEG, PNG, WEBP ou GIF." };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const validation = validateImageBuffer(buffer);
    if (!validation.isValid || !validation.mimeType || !validation.detectedFormat) {
      return { error: validation.error || "Formato de imagem inválido ou corrompido." };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    const ext = validation.detectedFormat;
    const key = `avatars/${userId}-${Date.now()}.${ext}`;

    const publicUrl = await uploadImageToR2(key, buffer, validation.mimeType);

    if (currentUser?.avatarUrl) {
      await deleteFileFromR2(currentUser.avatarUrl);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: publicUrl },
    });

    await logAudit("PROFILE_UPDATED", { action: "AVATAR_UPLOADED", size: file.size, type: file.type }, userId, tenantId);
    revalidatePath("/admin/settings");
    return { success: true, avatarUrl: publicUrl };
  } catch (error) {
    console.error("[UploadAvatar] Erro:", error);
    return { error: "Erro ao salvar foto de perfil." };
  }
}

export async function removeAvatarAction(): Promise<ActionState> {
  const { userId, tenantId } = await requireAuth();

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (currentUser?.avatarUrl) {
      await deleteFileFromR2(currentUser.avatarUrl);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });

    await logAudit("PROFILE_UPDATED", { action: "AVATAR_REMOVED" }, userId, tenantId);
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("[RemoveAvatar] Erro:", error);
    return { error: "Erro ao remover foto de perfil." };
  }
}
