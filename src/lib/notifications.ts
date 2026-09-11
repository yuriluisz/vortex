import "server-only";
import { Resend } from "resend";
import {
  renderVortexEmail,
  renderEmailMetadataCard,
  renderEmailCallout,
  escapeHtml,
  EmailBadgeType,
} from "@/lib/email-template";

const resend = new Resend(process.env.RESEND_API_KEY);
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Vórtex+ <onboarding@resend.dev>";
export const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || "suporte@vortexpages.online";

/**
 * Envia um email genérico via Resend (função central de envio do sistema).
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("[Notifications] Failed to send email:", error);
    return { success: false, error: "Falha ao enviar email." };
  }
}

/**
 * Envia email de report de conteúdo para o suporte/moderação.
 */
export async function sendReportEmail({
  reporterEmail,
  message,
  campaignSlug,
  campaignName,
  tenantSlug,
  contentType = "campaign",
}: {
  reporterEmail: string;
  message: string;
  campaignSlug: string;
  campaignName: string;
  tenantSlug: string;
  contentType?: "campaign" | "template";
}): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  const isTemplate = contentType === "template";
  const title = isTemplate ? "Template" : "Campanha";
  const subjectLabel = isTemplate ? "Template" : "Campanha";

  const metadataCard = renderEmailMetadataCard([
    { label: title, value: `${campaignName} (${campaignSlug})`, highlight: true },
    { label: isTemplate ? "Criador" : "Tenant", value: tenantSlug },
    { label: "Denunciante", value: reporterEmail },
    { label: "Data / Hora", value: now },
  ]);

  const messageCallout = renderEmailCallout({
    title: "Mensagem da Denúncia:",
    message,
    variant: "neutral",
  });

  const html = renderVortexEmail({
    title: `Denúncia de Conteúdo: ${title}`,
    category: "Moderação & Segurança",
    badgeType: "danger",
    bodyHtml: `
      <p style="margin: 0 0 14px; color: #d1d5db;">
        Uma nova denúncia de conteúdo foi registrada por um usuário na plataforma:
      </p>
      ${metadataCard}
      ${messageCallout}
    `,
    cta: {
      label: "Abrir Painel do Super Admin",
      url: "https://app.vortexpages.online/admin/super",
      variant: "danger",
    },
  });

  return sendEmail({
    to: ADMIN_ALERT_EMAIL,
    subject: `[Report] ${subjectLabel}: ${campaignSlug} — ${campaignName}`,
    html,
  });
}

/**
 * Envia email de aviso de grace period (pagamento vencido).
 */
export async function sendGracePeriodWarningEmail({
  to,
  tenantName,
  planName,
  daysRemaining,
}: {
  to: string;
  tenantName: string;
  planName: string;
  daysRemaining: number;
}): Promise<{ success: boolean; error?: string }> {
  const subject =
    daysRemaining <= 1
      ? "ÚLTIMO AVISO: Seu plano será rebaixado amanhã!"
      : `Seu pagamento está vencido — regularize em ${daysRemaining} dias`;

  const warningCallout = renderEmailCallout({
    title: "Atenção ao Prazo:",
    message: `Você tem ${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""} para regularizar a assinatura antes do rebaixamento automático.`,
    variant: "warning",
  });

  const html = renderVortexEmail({
    title: "Aviso de Pagamento Pendente",
    category: "Assinatura & Faturamento",
    badgeType: "warning",
    bodyHtml: `
      <p style="margin: 0 0 16px; color: #d1d5db;">Olá <strong>${escapeHtml(tenantName)}</strong>,</p>
      <p style="margin: 0 0 16px; color: #9ca3af;">
        Identificamos que o pagamento da mensalidade do seu plano <strong>${escapeHtml(planName)}</strong> está vencido.
      </p>
      ${warningCallout}
      <p style="margin: 0; color: #9ca3af; font-size: 14px;">
        Após este período, seu plano será rebaixado para <strong>Free</strong> e campanhas/grupos excedentes serão pausados temporariamente para evitar interrupção total dos seus serviços.
      </p>
    `,
    cta: {
      label: "Regularizar Assinatura no Painel",
      url: "https://app.vortexpages.online/admin/settings",
      variant: "warning",
    },
    footerNote: "Caso já tenha realizado o pagamento via PIX ou Boleto, a compensação bancária pode levar até 1 dia útil.",
  });

  return sendEmail({
    to,
    subject,
    html,
  });
}

/**
 * Envia email de status de template (aprovado, rejeitado, removido).
 */
export async function sendTemplateStatusEmail({
  to,
  authorName,
  templateName,
  status,
  reason,
}: {
  to: string;
  authorName: string;
  templateName: string;
  status: "PUBLISHED" | "REJECTED" | "TAKEN_DOWN";
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  const safeTemplateName = escapeHtml(templateName);
  const config: Record<
    "PUBLISHED" | "REJECTED" | "TAKEN_DOWN",
    {
      subject: string;
      category: string;
      badgeType: EmailBadgeType;
      title: string;
      message: string;
      ctaVariant: "primary" | "warning" | "danger";
    }
  > = {
    PUBLISHED: {
      subject: `Seu template "${safeTemplateName}" foi publicado!`,
      category: "Comunidade de Templates",
      badgeType: "success",
      title: "Template Aprovado & Publicado!",
      message: `Seu template <strong>${safeTemplateName}</strong> foi aprovado e agora está disponível na galeria pública da comunidade para milhares de criadores.`,
      ctaVariant: "primary",
    },
    REJECTED: {
      subject: `Seu template "${safeTemplateName}" precisa de ajustes`,
      category: "Moderação de Templates",
      badgeType: "danger",
      title: "Template Não Aprovado",
      message: `Seu template <strong>${safeTemplateName}</strong> precisa de alguns ajustes para atender aos critérios de qualidade da plataforma. Você pode editá-lo e reenviar a qualquer momento.`,
      ctaVariant: "danger",
    },
    TAKEN_DOWN: {
      subject: `Seu template "${safeTemplateName}" foi removido`,
      category: "Moderação de Templates",
      badgeType: "warning",
      title: "Template Removido da Galeria",
      message: `Seu template <strong>${safeTemplateName}</strong> foi despublicado da galeria da comunidade.`,
      ctaVariant: "warning",
    },
  };

  const currentConfig = config[status];

  const reasonCallout = reason
    ? renderEmailCallout({
        title: "Feedback da Equipe de Moderação:",
        message: reason,
        variant: currentConfig.badgeType,
      })
    : "";

  const html = renderVortexEmail({
    title: currentConfig.title,
    category: currentConfig.category,
    badgeType: currentConfig.badgeType,
    bodyHtml: `
      <p style="margin: 0 0 16px; color: #d1d5db;">Olá <strong>${escapeHtml(authorName)}</strong>,</p>
      <p style="margin: 0 0 16px; color: #9ca3af;">${currentConfig.message}</p>
      ${reasonCallout}
    `,
    cta: {
      label: "Acompanhar Meus Templates",
      url: "https://app.vortexpages.online/admin/templates",
      variant: currentConfig.ctaVariant,
    },
  });

  return sendEmail({
    to,
    subject: currentConfig.subject,
    html,
  });
}

/**
 * Envia email de notificação de downgrade efetivado.
 */
export async function sendDowngradeEmail({
  to,
  tenantName,
  reason,
}: {
  to: string;
  tenantName: string;
  reason: "INADIMPLENCIA" | "CANCELAMENTO_VOLUNTARIO";
}): Promise<{ success: boolean; error?: string }> {
  const reasonText =
    reason === "INADIMPLENCIA"
      ? "falta de compensação do pagamento da mensalidade"
      : "solicitação de cancelamento da assinatura";

  const limitsCard = renderEmailMetadataCard([
    { label: "Campanhas Ativas", value: "1 campanha (a mais recente)" },
    { label: "Grupos de WhatsApp", value: "Até 3 grupos em rotação" },
    { label: "Limite Mensal de Leads", value: "Até 100 leads / mês" },
  ]);

  const html = renderVortexEmail({
    title: "Plano Alterado para Free",
    category: "Assinatura & Limites",
    badgeType: "warning",
    bodyHtml: `
      <p style="margin: 0 0 16px; color: #d1d5db;">Olá <strong>${escapeHtml(tenantName)}</strong>,</p>
      <p style="margin: 0 0 16px; color: #9ca3af;">
        Seu plano foi alterado para <strong>Free</strong> devido a ${reasonText}.
      </p>
      <p style="margin: 0 0 8px; color: #f3f4f6; font-weight: 600; font-size: 14px;">
        Seus novos limites ativos:
      </p>
      ${limitsCard}
      <p style="margin: 0; color: #9ca3af; font-size: 14px;">
        Seus dados e leads anteriores continuam preservados com segurança. Você pode reativar seu plano PRO ou ULTRA a qualquer momento para desbloquear capacidade ilimitada.
      </p>
    `,
    cta: {
      label: "Reativar Plano no Painel",
      url: "https://app.vortexpages.online/admin/settings",
      variant: "primary",
    },
  });

  return sendEmail({
    to,
    subject: "Seu plano foi rebaixado para Free — Vórtex+",
    html,
  });
}