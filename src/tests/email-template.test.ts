import { describe, it, expect } from "vitest";
import {
  renderVortexEmail,
  renderEmailMetadataCard,
  renderEmailOtpBox,
  renderEmailCallout,
  escapeHtml,
} from "@/lib/email-template";

describe("Email Template System", () => {
  it("should render a base Vortex email with proper structure and brand header", () => {
    const html = renderVortexEmail({
      title: "Teste de E-mail",
      category: "Segurança",
      badgeType: "primary",
      bodyHtml: "<p>Conteúdo de teste</p>",
      cta: {
        label: "Acessar Painel",
        url: "https://vortexpages.online/admin",
        variant: "primary",
      },
      footerNote: "Nota de rodapé de teste",
    });

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("VÓRTEX");
    expect(html).toContain("Teste de E-mail");
    expect(html).toContain("Segurança");
    expect(html).toContain("Conteúdo de teste");
    expect(html).toContain("Acessar Painel");
    expect(html).toContain("https://vortexpages.online/admin");
    expect(html).toContain("Nota de rodapé de teste");
  });

  it("should render an OTP verification block with given code", () => {
    const otpBox = renderEmailOtpBox("982341", 5);

    expect(otpBox).toContain("982341");
    expect(otpBox).toContain("Código de Verificação");
    expect(otpBox).toContain("5 minutos");
  });

  it("should render a metadata card with multiple items and highlights", () => {
    const card = renderEmailMetadataCard([
      { label: "Workspace", value: "Acme Corp", highlight: true },
      { label: "Função", value: "Admin" },
    ]);

    expect(card).toContain("Workspace");
    expect(card).toContain("Acme Corp");
    expect(card).toContain("Função");
    expect(card).toContain("Admin");
  });

  it("should render callout banners with appropriate variants", () => {
    const callout = renderEmailCallout({
      title: "Atenção:",
      message: "Seu pagamento vence em 3 dias.",
      variant: "warning",
    });

    expect(callout).toContain("Atenção:");
    expect(callout).toContain("Seu pagamento vence em 3 dias.");
  });

  it("should escape malicious HTML in metadata card and callout to prevent email injection", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;");

    const card = renderEmailMetadataCard([
      { label: "<script>hack</script>", value: '<img src=x onerror="alert(1)">' },
    ]);
    expect(card).not.toContain("<script>");
    expect(card).toContain("&lt;script&gt;hack&lt;/script&gt;");
    expect(card).not.toContain("<img");
    expect(card).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");

    const callout = renderEmailCallout({
      title: "<h1>Malicious</h1>",
      message: "<a href='https://phishing.com'>Click</a>",
    });
    expect(callout).not.toContain("<h1>");
    expect(callout).toContain("&lt;h1&gt;Malicious&lt;/h1&gt;");
    expect(callout).not.toContain("<a href=");
    expect(callout).toContain("&lt;a href=&#039;https://phishing.com&#039;&gt;Click&lt;/a&gt;");
  });
});
