/**
 * Sistema centralizado e padronizado de templates de e-mail HTML do Vórtex+.
 * Estética Dark Mode refinada com compatibilidade ampla (Gmail, Apple Mail, Outlook, etc.).
 */

export type EmailBadgeType = "primary" | "success" | "warning" | "danger" | "neutral";
export type EmailCtaVariant = "primary" | "success" | "warning" | "danger";

export interface EmailTemplateOptions {
  /** Título principal no cabeçalho do card */
  title: string;
  /** Subtítulo ou categoria (ex: "Segurança", "Assinatura", "Equipe", "Moderação") */
  category?: string;
  /** Variante visual do badge da categoria */
  badgeType?: EmailBadgeType;
  /** Conteúdo HTML do corpo */
  bodyHtml: string;
  /** Botão de Ação Principal (opcional) */
  cta?: {
    label: string;
    url: string;
    variant?: EmailCtaVariant;
  };
  /** Nota de rodapé adicional dentro do card (opcional) */
  footerNote?: string;
}

const BADGE_COLORS: Record<EmailBadgeType, { bg: string; text: string; border: string }> = {
  primary: { bg: "rgba(99, 102, 241, 0.15)", text: "#818cf8", border: "rgba(99, 102, 241, 0.3)" },
  success: { bg: "rgba(34, 197, 94, 0.15)", text: "#4ade80", border: "rgba(34, 197, 94, 0.3)" },
  warning: { bg: "rgba(234, 179, 8, 0.15)", text: "#facc15", border: "rgba(234, 179, 8, 0.3)" },
  danger: { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" },
  neutral: { bg: "rgba(148, 163, 184, 0.12)", text: "#cbd5e1", border: "rgba(148, 163, 184, 0.25)" },
};

const CTA_COLORS: Record<EmailCtaVariant, { bg: string; text: string; shadow: string }> = {
  primary: { bg: "#6366f1", text: "#ffffff", shadow: "0 4px 14px 0 rgba(99, 102, 241, 0.35)" },
  success: { bg: "#16a34a", text: "#ffffff", shadow: "0 4px 14px 0 rgba(22, 163, 74, 0.35)" },
  warning: { bg: "#eab308", text: "#000000", shadow: "0 4px 14px 0 rgba(234, 179, 8, 0.35)" },
  danger: { bg: "#ef4444", text: "#ffffff", shadow: "0 4px 14px 0 rgba(239, 68, 68, 0.35)" },
};

/**
 * Renderiza o template base de e-mail do Vórtex+.
 */
export function renderVortexEmail({
  title,
  category = "Vórtex+",
  badgeType = "primary",
  bodyHtml,
  cta,
  footerNote,
}: EmailTemplateOptions): string {
  const badge = BADGE_COLORS[badgeType] || BADGE_COLORS.primary;
  const ctaStyle = cta?.variant ? CTA_COLORS[cta.variant] || CTA_COLORS.primary : CTA_COLORS.primary;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #030712;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #e5e7eb;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table {
      border-collapse: collapse;
      border-spacing: 0;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
      display: block;
    }
    a {
      color: #818cf8;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding-left: 12px !important;
        padding-right: 12px !important;
      }
      .card {
        padding: 24px 20px !important;
      }
      .code-block {
        font-size: 32px !important;
        letter-spacing: 8px !important;
      }
      .cta-button {
        width: 100% !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="background-color: #030712; margin: 0; padding: 40px 16px;">
  <center>
    <table class="container" role="presentation" width="100%" style="max-width: 580px; margin: 0 auto; text-align: left;">
      <!-- Logo Header -->
      <tr>
        <td style="padding-bottom: 24px; text-align: center;">
          <div style="display: inline-block; padding: 8px 18px; border-radius: 9999px; background: #0b0f19; border: 1px solid #1e293b; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);">
            <span style="font-size: 15px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff;">VÓRTEX<span style="color: #6366f1;">+</span></span>
          </div>
        </td>
      </tr>

      <!-- Main Card -->
      <tr>
        <td>
          <table class="card" role="presentation" width="100%" style="background-color: #090d16; border: 1px solid #1e293b; border-radius: 16px; padding: 36px 32px; box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.7);">
            <!-- Category Badge -->
            <tr>
              <td>
                <div style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 4px 12px; border-radius: 9999px; background-color: ${badge.bg}; color: ${badge.text}; border: 1px solid ${badge.border}; margin-bottom: 16px;">
                  ${category}
                </div>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td style="padding-bottom: 20px;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; line-height: 1.35; color: #f9fafb; letter-spacing: -0.5px;">
                  ${title}
                </h1>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="font-size: 15px; line-height: 1.65; color: #d1d5db; padding-bottom: 24px;">
                ${bodyHtml}
              </td>
            </tr>

            <!-- Action Button (if provided) -->
            ${
              cta
                ? `
            <tr>
              <td style="padding-top: 4px; padding-bottom: 24px; text-align: center;">
                <!--[if mso]>
                <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${cta.url}" style="height:46px;v-text-anchor:middle;width:240px;" arcsize="20%" stroke="f" fillcolor="${ctaStyle.bg}">
                  <w:anchorlock/>
                  <center style="color:${ctaStyle.text};font-family:sans-serif;font-size:14px;font-weight:bold;">${cta.label}</center>
                </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a href="${cta.url}" target="_blank" class="cta-button" style="display: inline-block; background-color: ${ctaStyle.bg}; color: ${ctaStyle.text}; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 10px; text-decoration: none; text-align: center; box-shadow: ${ctaStyle.shadow};">
                  ${cta.label}
                </a>
                <!--<![endif]-->
              </td>
            </tr>
            `
                : ""
            }

            <!-- Card Footer Note -->
            ${
              footerNote
                ? `
            <tr>
              <td style="border-top: 1px solid #1e293b; padding-top: 20px; font-size: 12px; color: #94a3b8; line-height: 1.55;">
                ${footerNote}
              </td>
            </tr>
            `
                : ""
            }
          </table>
        </td>
      </tr>

      <!-- Global Footer -->
      <tr>
        <td style="padding-top: 32px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
          <p style="margin: 0 0 6px;">
            <strong>Vórtex+</strong> — Infraestrutura e Gestão de Campanhas de Alta Conversão
          </p>
          <p style="margin: 0; color: #475569;">
            Mensagem automática do sistema. Caso você não tenha solicitado ou não reconheça este e-mail, pode desconsiderá-lo com segurança.
          </p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
  `.trim();
}

/**
 * Renderiza uma caixa de dados chave-valor padronizada para e-mails.
 */
export function renderEmailMetadataCard(
  items: Array<{ label: string; value: string; highlight?: boolean }>
): string {
  const rows = items
    .map(
      (item, idx) => `
    <div style="margin-bottom: ${idx === items.length - 1 ? "0" : "10px"};">
      <span style="display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 2px;">
        ${item.label}
      </span>
      <span style="font-size: 14px; font-weight: ${item.highlight ? "700" : "500"}; color: ${item.highlight ? "#818cf8" : "#f1f5f9"};">
        ${item.value}
      </span>
    </div>
  `
    )
    .join("");

  return `
    <div style="background-color: #0d1322; border: 1px solid #1e293b; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
      ${rows}
    </div>
  `.trim();
}

/**
 * Renderiza o bloco de código de segurança OTP.
 */
export function renderEmailOtpBox(code: string, expirationMinutes = 5): string {
  return `
    <div style="background-color: #0c101c; border: 1px solid #1e293b; border-radius: 14px; padding: 24px 16px; text-align: center; margin: 22px 0;">
      <span style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #818cf8; margin-bottom: 8px;">
        Código de Verificação
      </span>
      <div class="code-block" style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #ffffff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; line-height: 1.2;">
        ${code}
      </div>
      <div style="margin-top: 12px; font-size: 12px; color: #94a3b8;">
        ⏱️ Válido por <strong>${expirationMinutes} minutos</strong> (uso único)
      </div>
    </div>
  `.trim();
}

/**
 * Renderiza um banner de aviso/alerta/destaque no corpo do e-mail.
 */
export function renderEmailCallout({
  message,
  title,
  variant = "neutral",
}: {
  message: string;
  title?: string;
  variant?: EmailBadgeType;
}): string {
  const badge = BADGE_COLORS[variant] || BADGE_COLORS.neutral;

  return `
    <div style="background-color: ${badge.bg}; border: 1px solid ${badge.border}; border-radius: 10px; padding: 16px 18px; margin: 20px 0;">
      ${
        title
          ? `<strong style="display: block; font-size: 13px; font-weight: 700; color: ${badge.text}; margin-bottom: 6px;">${title}</strong>`
          : ""
      }
      <div style="font-size: 14px; color: #e2e8f0; line-height: 1.5; white-space: pre-wrap;">${message}</div>
    </div>
  `.trim();
}
