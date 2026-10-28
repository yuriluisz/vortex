import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

vi.mock("@/app/[slug]/actions", () => ({
  trackCampaignViewAction: vi.fn(),
  submitLeadAction: vi.fn(),
}));

import HtmlRenderer from "@/app/[slug]/HtmlRenderer";

const rawHtml = `<html><body><h1>Site</h1>{{FORM_SLOT}}<script>window.marker = "ran"</script></body></html>`;

function render(scriptsAllowed: boolean) {
  return renderToString(
    createElement(HtmlRenderer, { rawHtml, campaignId: "c1", slug: "site", formSchema: [], scriptsAllowed })
  );
}

describe("HtmlRenderer scriptsAllowed", () => {
  it("roda o HTML original num iframe sandbox sem allow-same-origin", () => {
    const out = render(true);
    const sandbox = out.match(/sandbox="([^"]*)"/)?.[1] ?? "";

    expect(out).toContain("<iframe");
    expect(sandbox).toContain("allow-scripts");
    expect(sandbox).not.toContain("allow-same-origin");
    expect(out).toContain("window.marker"); // script preservado dentro do srcdoc
    expect(out).not.toContain("FORM_SLOT");
  });

  it("mantém a sanitização quando scripts não estão liberados", () => {
    const out = render(false);

    expect(out).not.toContain("<iframe");
    expect(out).not.toContain("window.marker");
  });
});
