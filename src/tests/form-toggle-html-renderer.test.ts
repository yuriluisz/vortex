import { describe, it, expect, vi } from "vitest";

// Mock server actions called by HtmlRenderer
vi.mock("@/app/[slug]/actions", () => ({
  trackCampaignViewAction: vi.fn(),
  submitLeadAction: vi.fn(),
}));

describe("HtmlRenderer Form Toggle Behavior", () => {
  it("suppresses {{FORM_SLOT}} when formEnabled is false", () => {
    const rawHtml = `
      <div class="hero">
        <h1>Oferta Especial</h1>
        {{FORM_SLOT}}
      </div>
    `;

    const SLOT_REGEX = /\{\{\s*FORM_SLOT\s*\}\}/gi;
    const formEnabled = false;

    const processed = formEnabled
      ? rawHtml.replace(SLOT_REGEX, '<div data-vortex-form-slot="true"></div>')
      : rawHtml.replace(SLOT_REGEX, "");

    expect(processed).not.toContain("{{FORM_SLOT}}");
    expect(processed).not.toContain("data-vortex-form-slot");
  });

  it("replaces {{FORM_SLOT}} with anchor slot when formEnabled is true", () => {
    const rawHtml = `
      <div class="hero">
        <h1>Oferta Especial</h1>
        {{FORM_SLOT}}
      </div>
    `;

    const SLOT_REGEX = /\{\{\s*FORM_SLOT\s*\}\}/gi;
    const formEnabled = true;

    const processed = formEnabled
      ? rawHtml.replace(SLOT_REGEX, '<div data-vortex-form-slot="true"></div>')
      : rawHtml.replace(SLOT_REGEX, "");

    expect(processed).not.toContain("{{FORM_SLOT}}");
    expect(processed).toContain('data-vortex-form-slot="true"');
  });

  it("handles variations in whitespace inside {{ FORM_SLOT }} correctly", () => {
    const rawHtml = `
      <div>{{  FORM_SLOT  }}</div>
      <div>{{FORM_SLOT}}</div>
      <div>{{ form_slot }}</div>
    `;

    const SLOT_REGEX = /\{\{\s*FORM_SLOT\s*\}\}/gi;
    const cleaned = rawHtml.replace(SLOT_REGEX, "");

    expect(cleaned.trim()).toBe("<div></div>\n      <div></div>\n      <div></div>");
  });
});
