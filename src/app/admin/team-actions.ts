"use server";

import { prisma } from "@/lib/prisma";
import { getSession, switchTenantSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/notifications";
import { renderVortexEmail, renderEmailMetadataCard, escapeHtml } from "@/lib/email-template";
import { z } from "zod";
import { redirect } from "next/navigation";

const InviteMemberSchema = z.object({
  email: z.string().email("E-mail inválido").toLowerCase().trim(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export interface TeamActionResult {
  success?: boolean;
  error?: string;
}

/**
 * Convida um membro para fazer parte da equipe do Tenant.
 */
export async function inviteTeamMemberAction(
  email: string,
  role: "ADMIN" | "MEMBER"
): Promise<TeamActionResult> {
  const session = await getSession();
  if (!session?.userId || !session.tenantId) {
    return { error: "Não autorizado." };
  }

  if (session.role === "MEMBER") {
    return { error: "Apenas administradores podem convidar membros para a equipe." };
  }

  const parsed = InviteMemberSchema.safeParse({ email, role });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  const cleanEmail = parsed.data.email;

  // 1. Obter dados do Tenant atual
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: { users: { select: { id: true, email: true } } },
  });

  if (!tenant) {
    return { error: "Tenant não encontrado." };
  }

  // 2. Não permitir convidar o próprio dono
  if (session.email.toLowerCase() === cleanEmail) {
    return { error: "Você já é o dono desta conta." };
  }

  // 3. Buscar ou criar token para o usuário convidado
  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
    select: { id: true, name: true, email: true },
  });

  try {
    if (existingUser) {
      // Já existe: vincula diretamente em TenantMember
      await prisma.tenantMember.upsert({
        where: {
          tenantId_userId: {
            tenantId: tenant.id,
            userId: existingUser.id,
          },
        },
        update: { role: parsed.data.role },
        create: {
          tenantId: tenant.id,
          userId: existingUser.id,
          role: parsed.data.role,
        },
      });
    }

    // 4. Enviar e-mail com Resend
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vortexpages.online";
    const inviteUrl = existingUser
      ? `${baseUrl}/admin`
      : `${baseUrl}/signup?email=${encodeURIComponent(cleanEmail)}&tenantInvite=${tenant.id}`;

    const roleLabel = parsed.data.role === "ADMIN" ? "Admin" : "Membro";

    const metadataCard = renderEmailMetadataCard([
      { label: "Workspace", value: tenant.name, highlight: true },
      { label: "Função na Equipe", value: roleLabel },
      { label: "Convidado por", value: session.email },
    ]);

    const emailHtml = renderVortexEmail({
      title: "Convite para Equipe do Workspace",
      category: "Equipe & Colaboração",
      badgeType: "primary",
      bodyHtml: `
        <p style="margin: 0 0 14px; color: #d1d5db;">
          Olá! Você foi convidado para colaborar no workspace <strong>${escapeHtml(tenant.name)}</strong> no Vórtex+:
        </p>
        ${metadataCard}
        <p style="margin: 0; color: #9ca3af; font-size: 14px;">
          ${existingUser ? "Você já possui uma conta no Vórtex+. Basta acessar para alternar entre seus workspaces diretamente no menu." : "Clique no botão abaixo para criar sua conta gratuita e acessar o workspace."}
        </p>
      `,
      cta: {
        label: existingUser ? "Acessar Workspace" : "Aceitar Convite e Acessar",
        url: inviteUrl,
        variant: "primary",
      },
      footerNote: "Se você não reconhece este convite, pode ignorar esta mensagem com segurança.",
    });

    await sendEmail({
      to: cleanEmail,
      subject: `Convite para a equipe: ${tenant.name} — Vórtex+`,
      html: emailHtml,
    });

    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: session.userId,
        action: "MEMBER_INVITED",
        details: { invitedEmail: cleanEmail, role: parsed.data.role },
      },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to invite team member:", error);
    return { error: "Erro ao convidar membro. Tente novamente." };
  }
}

/**
 * Remove um membro da equipe do Tenant.
 */
export async function removeTeamMemberAction(memberId: string): Promise<TeamActionResult> {
  const session = await getSession();
  if (!session?.userId || !session.tenantId) {
    return { error: "Não autorizado." };
  }

  if (session.role === "MEMBER") {
    return { error: "Apenas administradores podem remover membros da equipe." };
  }

  const member = await prisma.tenantMember.findUnique({
    where: { id: memberId },
    include: { user: true },
  });

  if (!member || member.tenantId !== session.tenantId) {
    return { error: "Membro não encontrado ou sem permissão para remover." };
  }

  // Não permitir remover a si mesmo se for a única conta
  if (member.userId === session.userId) {
    return { error: "Você não pode remover a si mesmo." };
  }

  try {
    await prisma.tenantMember.delete({
      where: { id: memberId },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        action: "MEMBER_REMOVED",
        details: { removedUserId: member.userId, removedEmail: member.user.email },
      },
    });

    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove member:", error);
    return { error: "Erro ao remover membro da equipe." };
  }
}

/**
 * Lista os membros do Tenant atual.
 */
export async function getTeamMembersAction() {
  const session = await getSession();
  if (!session?.userId || !session.tenantId) {
    return [];
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: {
      users: { select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true } },
      tenantMembers: {
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true } },
        },
      },
    },
  });

  if (!tenant) return [];

  const members = [];

  // Dono(s) direto(s) do Tenant
  for (const u of tenant.users) {
    members.push({
      id: `owner-${u.id}`,
      userId: u.id,
      name: u.name || "Sem nome",
      email: u.email,
      role: "OWNER" as const,
      avatarUrl: u.avatarUrl,
      isOwner: true,
      joinedAt: u.createdAt.toISOString(),
    });
  }

  // Membros convidados
  for (const m of tenant.tenantMembers) {
    if (!members.some((x) => x.userId === m.userId)) {
      members.push({
        id: m.id,
        userId: m.userId,
        name: m.user.name || "Sem nome",
        email: m.user.email,
        role: m.role,
        avatarUrl: m.user.avatarUrl,
        isOwner: false,
        joinedAt: m.createdAt.toISOString(),
      });
    }
  }

  return members;
}

/**
 * Alterna o Workspace ativo na sessão do usuário.
 */
export async function switchActiveTenantAction(targetTenantId: string) {
  const session = await getSession();
  if (!session?.userId) {
    return { error: "Não autorizado." };
  }

  // 1. Verificar se o usuário é dono ou membro do targetTenantId
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      tenant: true,
      tenantMemberships: { where: { tenantId: targetTenantId }, include: { tenant: true } },
    },
  });

  if (!user) {
    return { error: "Usuário não encontrado." };
  }

  let targetTenant = null;
  let targetRole = "MEMBER";

  if (user.tenant?.id === targetTenantId && user.tenant.active) {
    targetTenant = user.tenant;
    targetRole = user.role;
  } else if (user.tenantMemberships.length > 0 && user.tenantMemberships[0].tenant.active) {
    targetTenant = user.tenantMemberships[0].tenant;
    targetRole = user.tenantMemberships[0].role;
  }

  if (!targetTenant) {
    return { error: "Workspace não encontrado ou inativo." };
  }

  await switchTenantSession(
    user.id,
    user.email,
    targetTenant.id,
    targetTenant.slug,
    targetTenant.plan,
    targetRole
  );

  await prisma.auditLog.create({
    data: {
      tenantId: targetTenant.id,
      userId: user.id,
      action: "TENANT_SWITCHED",
      details: { targetTenantId, targetTenantSlug: targetTenant.slug },
    },
  });

  revalidatePath("/admin");
  redirect("/admin");
}
