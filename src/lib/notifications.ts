import "server-only";
import { Resend } from "resend";
import { renderVortexEmail } from "@/lib/email-template";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Vórtex+ <onboarding@resend.dev>";

/**
 * Envia um email genérico via Resend.
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
 * Envia email de report de conteúdo para o suporte.
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

  const html = renderVortexEmail({
    title: `Denúncia de Conteúdo: ${title}`,
    category: "Moderação & Segurança",
    badgeType: "danger",
    bodyHtml: `
      <div style="background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0 0 8px; color: #d1d5db;"><strong>${title}:</strong> ${campaignName} (<code style="color: #818cf8;">${campaignSlug}</code>)</p>
        <p style="margin: 0 0 8px; color: #d1d5db;"><strong>${isTemplate ? "Criador" : "Tenant"}:</strong> ${tenantSlug}</p>
        <p style="margin: 0 0 8px; color: #d1d5db;"><strong>Denunciante:</strong> ${reporterEmail}</p>
        <p style="margin: 0; color: #9ca3af; font-size: 13px;"><strong>Data/Hora:</strong> ${now}</p>
      </div>
      <h3 style="font-size: 15px; color: #f3f4f6; margin: 0 0 10px;">Mensagem da Denúncia:</h3>
      <div style="background: #030712; border: 1px solid #374151; border-radius: 8px; padding: 16px; white-space: pre-wrap; color: #e5e7eb; font-size: 14px;">${message}</div>
    `,
    cta: {
      label: "Abrir Painel do Super Admin",
      url: "https://app.vortexpages.online/admin/super",
      variant: "danger",
    },
  });

  return sendEmail({
    to: "yulusica@gmail.com",
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

  const html = renderVortexEmail({
    title: "Aviso de Pagamento Pendente",
    category: "Assinatura & Faturamento",
    badgeType: "warning",
    bodyHtml: `
      <p style="margin: 0 0 16px; color: #d1d5db;">Olá <strong>${tenantName}</strong>,</p>
      <p style="margin: 0 0 16px; color: #9ca3af;">
        Identificamos que o pagamento da mensalidade do seu plano <strong>${planName}</strong> está vencido.
      </p>
      <div style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.25); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 18px; font-weight: 700; color: #facc15;">
          Você tem ${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""} para regularizar antes do rebaixamento.
        </span>
      </div>
      <p style="margin: 0; color: #9ca3af; font-size: 14px;">
        Após este período, seu plano será rebaixado para <strong>Free</strong> e campanhas/grupos excedentes serão pausados automaticamente para evitar interrupção total.
      </p>
    `,
    cta: {
      label: "Regularizar Assinatura no Painel",
      url: "https://app.vortexpages.online/admin/settings",
      variant: "warning",
    },
    footerNote: "Caso já tenha realizado o pagamento via PIX ou Boleto, a compensação pode levar até 1 dia útil.",
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
  const config = {
    PUBLISHED: {
      subject: `✅ Seu template "${templateName}" foi publicado!`,
      category: "Comunidade de Templates",
      badgeType: "success" as const,
      title: "Template Aprovado & Publicado!",
      message: `Seu template <strong>${templateName}</strong> foi aprovado e agora está disponível na galeria da comunidade para milhares de criadores.`,
      ctaVariant: "primary" as const,
    },
    REJECTED: {
      subject: `❌ Seu template "${templateName}" precisa de ajustes`,
      category: "Moderação de Templates",
      badgeType: "danger" as const,
      title: "Template Não Aprovado",
      message: `Seu template <strong>${templateName}</strong> não atendeu a todos os critérios de qualidade e segurança da nossa diretriz. Você pode ajustar e reenviar a qualquer momento.`,
      ctaVariant: "danger" as const,
    },
    TAKEN_DOWN: {
      subject: `⚠️ Seu template "${templateName}" foi removido`,
      category: "Moderação de Templates",
      badgeType: "warning" as const,
      title: "Template Removido da Galeria",
      message: `Seu template <strong>${templateName}</strong> foi removido da comunidade pública.`,
      ctaVariant: "warning" as const,
    },
  }[status];

  const html = renderVortexEmail({
    title: config.title,
    category: config.category,
    badgeType: config.badgeType,
    bodyHtml: `
      <p style="margin: 0 0 16px; color: #d1d5db;">Olá <strong>${authorName}</strong>,</p>
      <p style="margin: 0 0 16px; color: #9ca3af;">${config.message}</p>
      ${
        reason
          ? `
        <div style="background: #111827; border: 1px solid #1f2937; border-left: 4px solid #6366f1; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <strong style="color: #f3f4f6; font-size: 14px;">Feedback da Equipe de Moderação:</strong>
          <p style="margin: 8px 0 0; color: #d1d5db; font-size: 14px; white-space: pre-wrap;">${reason}</p>
        </div>
      `
          : ""
      }
    `,
    cta: {
      label: "Acompanhar Meus Templates",
      url: "https://app.vortexpages.online/admin/templates",
      variant: config.ctaVariant,
    },
  });

  return sendEmail({
    to,
    subject: config.subject,
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
      ? "falta de compensação do pagamento"
      : "solicitação de cancelamento da assinatura";

  const html = renderVortexEmail({
    title: "Plano Alterado para Free",
    category: "Assinatura & Limites",
    badgeType: "warning",
    bodyHtml: `
      <p style="margin: 0 0 16px; color: #d1d5db;">Olá <strong>${tenantName}</strong>,</p>
      <p style="margin: 0 0 16px; color: #9ca3af;">
        Seu plano foi rebaixado para <strong>Free</strong> devido a ${reasonText}.
      </p>
      <div style="background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h4 style="margin: 0 0 12px; font-size: 14px; color: #f3f4f6;">Seus novos limites ativos:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #9ca3af; font-size: 14px; line-height: 1.8;">
          <li>1 campanha ativa (a mais recente criada)</li>
          <li>3 grupos de WhatsApp com rotação ativa</li>
          <li>Limite mensal de até 100 leads</li>
        </ul>
      </div>
      <p style="margin: 0; color: #9ca3af; font-size: 14px;">
        Seus dados e leads anteriores continuam salvos e você pode reativar seu plano PRO ou ULTRA a qualquer momento para desbloquear capacidade ilimitada.
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