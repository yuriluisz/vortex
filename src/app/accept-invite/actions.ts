"use server";

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";

const AcceptInviteSchema = z.object({
  token: z.string().uuid("Token de convite inválido"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").trim(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export interface AcceptInviteResult {
  error?: string;
  success?: boolean;
}

export async function getInviteDetailsAction(token: string) {
  if (!token) return null;

  const share = await prisma.campaignShare.findUnique({
    where: { token },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          tenant: { select: { name: true } },
        },
      },
    },
  });

  if (!share) return null;

  return {
    email: share.email,
    campaignName: share.campaign.name,
    ownerName: share.campaign.tenant.name,
    permission: share.permission,
  };
}

export async function acceptInviteAction(
  prevState: unknown,
  formData: FormData
): Promise<AcceptInviteResult> {
  const token = formData.get("token") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  const parsed = AcceptInviteSchema.safeParse({ token, name, password });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  // 1. Buscar o convite pelo token
  const share = await prisma.campaignShare.findUnique({
    where: { token: parsed.data.token },
    include: {
      campaign: {
        select: { id: true, name: true, tenantId: true },
      },
    },
  });

  if (!share) {
    return { error: "Convite não encontrado ou já expirado." };
  }

  // 2. Verificar se já existe usuário com este e-mail
  let user = await prisma.user.findUnique({
    where: { email: share.email },
    include: { tenant: true },
  });

  if (!user) {
    // Criar tenant pessoal para o novo usuário
    const cleanSlug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30);

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const tenantSlug = `${cleanSlug || "workspace"}-${randomSuffix}`;

    const newTenant = await prisma.tenant.create({
      data: {
        name: `Workspace de ${name}`,
        slug: tenantSlug,
        plan: "FREE",
      },
    });

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    user = await prisma.user.create({
      data: {
        email: share.email,
        name: parsed.data.name,
        passwordHash,
        tenantId: newTenant.id,
        role: "ADMIN",
      },
      include: { tenant: true },
    });
  }

  // 3. Atualizar o convite como aceito
  await prisma.campaignShare.update({
    where: { id: share.id },
    data: {
      userId: user.id,
      accepted: true,
      token: null,
    },
  });

  // 4. Iniciar sessão do usuário
  if (user.tenant) {
    await createSession(
      user.id,
      user.email,
      user.tenant.id,
      user.tenant.slug,
      user.tenant.plan,
      user.role
    );
  }

  redirect("/admin/campaigns");
}
