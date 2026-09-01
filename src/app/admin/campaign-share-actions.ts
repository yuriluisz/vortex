"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/notifications";
import { renderVortexEmail, renderEmailMetadataCard, escapeHtml } from "@/lib/email-template";
import { z } from "zod";

const ShareCampaignSchema = z.object({
  campaignId: z.string().uuid("ID de campanha inválido"),
  email: z.string().email("E-mail inválido").toLowerCase().trim(),
  permission: z.enum(["VIEW", "EDIT"]).default("VIEW"),
});

export interface ShareActionResult {
  success?: boolean;
  error?: string;
}

/**
 * Compartilha uma campanha específica com um gestor ou visualizador externo.
 */
export async function shareCampaignAction(
  campaignId: string,
  email: string,
  permission: "VIEW" | "EDIT"
): Promise<ShareActionResult> {
  const session = await getSession();
  if (!session?.userId || !session.tenantId) {
    return { error: "Não autorizado." };
  }
  if (session.role === "MEMBER") {
    return { error: "Apenas administradores podem gerenciar compartilhamentos de campanhas." };
  }

  const parsed = ShareCampaignSchema.safeParse({ campaignId, email, permission });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  const cleanEmail = parsed.data.email;

  // 1. Verificar se a campanha pertence ao Tenant do usuário atual
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { tenant: true },
  });

  if (!campaign || campaign.tenantId !== session.tenantId) {
    return { error: "Campanha não encontrada ou sem permissão para compartilhar." };
  }

  // 2. Não permitir compartilhar consigo mesmo
  if (session.email.toLowerCase() === cleanEmail) {
    return { error: "Você já é o dono desta campanha." };
  }

  // 3. Verificar se o usuário convidado já possui conta no Vórtex
  const existingUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
    select: { id: true, name: true, email: true },
  });

  const token = existingUser ? null : crypto.randomUUID();
  const accepted = Boolean(existingUser);

  try {
    const share = await prisma.campaignShare.upsert({
      where: {
        campaignId_email: {
          campaignId,
          email: cleanEmail,
        },
      },
      update: {
        permission: parsed.data.permission,
        userId: existingUser ? existingUser.id : null,
        accepted,
      },
      create: {
        campaignId,
        email: cleanEmail,
        permission: parsed.data.permission,
        userId: existingUser ? existingUser.id : null,
        token,
        accepted,
      },
    });

    // 4. Enviar e-mail de notificação / convite via Resend
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vortexpages.online";
    const inviteUrl = existingUser
      ? `${baseUrl}/admin/campaigns`
      : `${baseUrl}/accept-invite?token=${token}`;

    const permissionLabel = parsed.data.permission === "EDIT" ? "Editor" : "Visualizador";

    const metadataCard = renderEmailMetadataCard([
      { label: "Campanha", value: campaign.name, highlight: true },
      { label: "Permissão de Acesso", value: permissionLabel },
      { label: "Compartilhado por", value: session.email },
    ]);

    const emailHtml = renderVortexEmail({
      title: "Acesso Compartilhado à Campanha",
      category: "Colaboração & Gestão",
      badgeType: "primary",
      bodyHtml: `
        <p style="margin: 0 0 14px; color: #d1d5db;">
          Olá! O usuário <strong>${escapeHtml(session.email)}</strong> concedeu a você acesso à campanha <strong>${escapeHtml(campaign.name)}</strong> no Vórtex+:
        </p>
        ${metadataCard}
        <p style="margin: 0; color: #9ca3af; font-size: 14px;">
          ${existingUser ? "Acesse seu painel para acompanhar as métricas, leads capturados e grupos associados." : "Clique no botão abaixo para criar sua senha de acesso e visualizar a campanha."}
        </p>
      `,
      cta: {
        label: existingUser ? "Acessar Campanha" : "Aceitar Convite e Acessar",
        url: inviteUrl,
        variant: "primary",
      },
      footerNote: "Se você não conhece o remetente ou não esperava este convite, pode ignorar esta mensagem.",
    });

    await sendEmail({
      to: cleanEmail,
      subject: `Acesso compartilhado: ${campaign.name} — Vórtex+`,
      html: emailHtml,
    });

    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        action: "CAMPAIGN_SHARED",
        details: { campaignId, campaignName: campaign.name, invitedEmail: cleanEmail, permission: parsed.data.permission },
      },
    });

    revalidatePath("/admin/campaigns");
    revalidatePath(`/admin/campaigns/${campaignId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to share campaign:", error);
    return { error: "Erro ao compartilhar campanha. Tente novamente." };
  }
}

/**
 * Revoga o acesso de um convidado a uma campanha.
 */
export async function revokeCampaignShareAction(shareId: string): Promise<ShareActionResult> {
  const session = await getSession();
  if (!session?.userId || !session.tenantId) {
    return { error: "Não autorizado." };
  }
  if (session.role === "MEMBER") {
    return { error: "Apenas administradores podem gerenciar compartilhamentos de campanhas." };
  }

  const share = await prisma.campaignShare.findUnique({
    where: { id: shareId },
    include: { campaign: true },
  });

  if (!share || share.campaign.tenantId !== session.tenantId) {
    return { error: "Compartilhamento não encontrado ou sem permissão para revogar." };
  }

  try {
    await prisma.campaignShare.delete({
      where: { id: shareId },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        action: "CAMPAIGN_UNSHARED",
        details: { campaignId: share.campaignId, revokedEmail: share.email },
      },
    });

    revalidatePath("/admin/campaigns");
    revalidatePath(`/admin/campaigns/${share.campaignId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to revoke campaign share:", error);
    return { error: "Erro ao revogar compartilhamento." };
  }
}

/**
 * Lista todos os compartilhamentos ativos de uma campanha.
 */
export async function getCampaignSharesAction(campaignId: string) {
  const session = await getSession();
  if (!session?.userId || !session.tenantId) {
    return [];
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { tenantId: true },
  });

  if (!campaign || campaign.tenantId !== session.tenantId) {
    return [];
  }

  const shares = await prisma.campaignShare.findMany({
    where: { campaignId },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return shares.map((s) => ({
    id: s.id,
    email: s.email,
    permission: s.permission,
    accepted: s.accepted,
    createdAt: s.createdAt.toISOString(),
    userName: s.user?.name || null,
    avatarUrl: s.user?.avatarUrl || null,
  }));
}
