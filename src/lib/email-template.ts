/**
 * Sistema centralizado e padronizado de templates de e-mail HTML do Vórtex+.
 * Compatível com os principais clientes de e-mail (Gmail, Apple Mail, Outlook, etc.).
 */

interface EmailTemplateOptions {
  /** Título principal no cabeçalho */
  title: string;
  /** Subtítulo ou categoria (ex: "Segurança", "Assinatura", "Comunidade") */
  category?: string;
  /** Badge color: "primary" | "success" | "warning" | "danger" */
  badgeType?: "primary" | "success" | "warning" | "danger";
  /** Conteúdo HTML do corpo */
  bodyHtml: string;
  /** Botão de Ação Principal (opcional) */
  cta?: {
    label: string;
    url: string;
    variant?: "primary" | "warning" | "danger";
  };
  /** Nota de rodapé adicional (opcional) */
  footerNote?: string;
}

const BADGE_COLORS = {
  primary: { bg: "rgba(99, 102, 241, 0.15)", text: "#818cf8", border: "rgba(99, 102, 241, 0.3)" },
  success: { bg: "rgba(34, 197, 94, 0.15)", text: "#4ade80", border: "rgba(34, 197, 94, 0.3)" },
  warning: { bg: "rgba(234, 179, 8, 0.15)", text: "#facc15", border: "rgba(234, 179, 8, 0.3)" },
  danger: { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171", border: "rgba(239, 68, 68, 0.3)" },
};

const CTA_COLORS = {
  primary: { bg: "#6366f1", hover: "#4f46e5", text: "#ffffff" },
  warning: { bg: "#eab308", hover: "#ca8a04", text: "#000000" },
  danger: { bg: "#ef4444", hover: "#dc2626", text: "#ffffff" },
};

export function renderVortexEmail({
  title,
  category = "Vórtex+",
  badgeType = "primary",
  bodyHtml,
  cta,
  footerNote,
}: EmailTemplateOptions): string {
  const badge = BADGE_COLORS[badgeType] || BADGE_COLORS.primary;
  const ctaStyle = cta?.variant ? CTA_COLORS[cta.variant] : CTA_COLORS.primary;

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #030712;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e5e7eb;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-spacing: 0;
    }
    td {
      padding: 0;
    }
    img {
      border: 0;
    }
    a {
      color: #818cf8;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 16px !important;
      }
      .card {
        padding: 24px 20px !important;
      }
      .code-block {
        font-size: 28px !important;
        letter-spacing: 6px !important;
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
          <div style="display: inline-block; padding: 8px 16px; border-radius: 9999px; background: #111827; border: 1px solid #1f2937;">
            <span style="font-size: 16px; font-weight: 800; letter-spacing: 1px; color: #ffffff;">VÓRTEX<span style="color: #6366f1;">+</span></span>
          </div>
        </td>
      </tr>

      <!-- Main Card -->
      <tr>
        <td>
          <table class="card" role="presentation" width="100%" style="background-color: #090d16; border: 1px solid #1e293b; border-radius: 16px; padding: 36px 32px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);">
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
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; line-height: 1.3; color: #f9fafb; letter-spacing: -0.5px;">
                  ${title}
                </h1>
              </td>
            </tr>

            <!-- Body Content -->
            <tr>
              <td style="font-size: 15px; line-height: 1.6; color: #9ca3af; padding-bottom: 24px;">
                ${bodyHtml}
              </td>
            </tr>

            <!-- Action Button (if provided) -->
            ${
              cta
                ? `
            <tr>
              <td style="padding-top: 8px; padding-bottom: 24px; text-align: center;">
                <a href="${cta.url}" target="_blank" style="display: inline-block; background-color: ${ctaStyle.bg}; color: ${ctaStyle.text}; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 10px; text-decoration: none; text-align: center; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);">
                  ${cta.label}
                </a>
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
              <td style="border-top: 1px solid #1e293b; padding-top: 20px; font-size: 12px; color: #64748b; line-height: 1.5;">
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
        <td style="padding-top: 32px; text-align: center; font-size: 12px; color: #475569; line-height: 1.6;">
          <p style="margin: 0 0 8px;">
            Vórtex+ — Gerenciador de Lançamentos de Alta Conversão
          </p>
          <p style="margin: 0;">
            Se você não solicitou ou não reconhece este e-mail, por favor ignore ou entre em contato com nosso suporte.
          </p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
  `.trim();
}
