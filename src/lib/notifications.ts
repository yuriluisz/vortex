import "server-only";
import { Resend } from "resend";

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
}: {
  reporterEmail: string;
  message: string;
  campaignSlug: string;
  campaignName: string;
  tenantSlug: string;
}): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  return sendEmail({
    to: "yulusica@gmail.com",
    subject: `[Report] Campanha: ${campaignSlug} — ${campaignName}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #e5e5e5; border-radius: 12px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #ffffff;">🚩 Report de Conteúdo</h1>
        <hr style="border: none; border-top: 1px solid #262626; margin: 16px 0;" />
        <p><strong>Campanha:</strong> ${campaignName} (${campaignSlug})</p>
        <p><strong>Tenant:</strong> ${tenantSlug}</p>
        <p><strong>Email do denunciante:</strong> ${reporterEmail}</p>
        <p><strong>Data/Hora:</strong> ${now}</p>
        <hr style="border: none; border-top: 1px solid #262626; margin: 16px 0;" />
        <h2 style="font-size: 16px; color: #ffffff;">Mensagem:</h2>
        <p style="background: #171717; border: 1px solid #262626; border-radius: 8px; padding: 16px; white-space: pre-wrap;">${message}</p>
      </div>
    `,
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

  return sendEmail({
    to,
    subject,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #e5e5e5; border-radius: 12px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #ffffff;">⚠️ Pagamento Vencido</h1>
        <p>Olá <strong>${tenantName}</strong>,</p>
        <p>O pagamento do seu plano <strong>${planName}</strong> está vencido.</p>
        <p style="font-size: 18px; font-weight: 700; color: #fbbf24; text-align: center; margin: 24px 0;">
          Você tem ${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""} para regularizar antes do rebaixamento.
        </p>
        <p>Após esse período, seu plano será rebaixado para <strong>Free</strong> e algumas campanhas/grupos serão desativados.</p>
        <p style="margin-top: 24px;">Acesse o painel para regularizar: <a href="https://app.vortexpages.online/admin" style="color: #818cf8;">app.vortexpages.online/admin</a></p>
        <hr style="border: none; border-top: 1px solid #262626; margin: 24px 0;" />
        <p style="font-size: 12px; color: #525252;">Vórtex+ — Gerenciador de Lançamentos</p>
      </div>
    `,
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
      ? "falta de pagamento"
      : "cancelamento da assinatura";

  return sendEmail({
    to,
    subject: "Seu plano foi rebaixado para Free",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0a0a0a; color: #e5e5e5; border-radius: 12px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #ffffff;">🔻 Plano Rebaixado</h1>
        <p>Olá <strong>${tenantName}</strong>,</p>
        <p>Seu plano foi rebaixado para <strong>Free</strong> devido a ${reasonText}.</p>
        <p>O que mudou:</p>
        <ul>
          <li>Apenas 1 campanha permanece ativa (a mais recente)</li>
          <li>Apenas 3 grupos permanecem ativos (os mais recentes)</li>
          <li>Novos leads estão bloqueados até o limite de 100</li>
        </ul>
        <p>Você pode reativar seu plano a qualquer momento pelo painel.</p>
        <p style="margin-top: 24px;">
          <a href="https://app.vortexpages.online/admin" style="display: inline-block; background: #818cf8; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Acessar Painel
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #262626; margin: 24px 0;" />
        <p style="font-size: 12px; color: #525252;">Vórtex+ — Gerenciador de Lançamentos</p>
      </div>
    `,
  });
}