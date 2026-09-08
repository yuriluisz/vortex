import { describe, it, expect } from "vitest";
import {
  getSimulatedViewportHeight,
  buildPreviewDoc,
  clampIframeHeight,
  shouldUpdateHeight,
  getSafeCanvasDimensions,
} from "@/components/admin/recordings/HeatmapView";

describe("HeatmapView Dimension & Loop Protection", () => {
  describe("getSimulatedViewportHeight", () => {
    it("should return correct simulated viewport height for mobile presets", () => {
      expect(getSimulatedViewportHeight("mobile", "360", "fluid")).toBe(780);
      expect(getSimulatedViewportHeight("mobile", "390", "fluid")).toBe(844);
      expect(getSimulatedViewportHeight("mobile", "428", "fluid")).toBe(926);
      expect(getSimulatedViewportHeight("mobile", "fluid", "fluid")).toBe(800);
    });

    it("should return correct simulated viewport height for desktop presets", () => {
      expect(getSimulatedViewportHeight("desktop", "390", "fluid")).toBe(800);
      expect(getSimulatedViewportHeight("desktop", "390", "1200")).toBe(800);
      expect(getSimulatedViewportHeight("desktop", "390", "tablet")).toBe(1024);
    });
  });

  describe("buildPreviewDoc & Safety Injection", () => {
    it("should inject vortex-preview-safety into HTML snippet without html tags", () => {
      const raw = `<div class="min-h-screen bg-black py-24"><h1>Titulo</h1>{{FORM_SLOT}}</div>`;
      const doc = buildPreviewDoc(raw, 844);

      expect(doc).toContain("id=\"vortex-preview-safety\"");
      expect(doc).toContain("--vortex-viewport-h: 844px;");
      expect(doc).toContain(".min-h-screen");
      expect(doc).toContain("min-height: var(--vortex-viewport-h)");
      expect(doc).toContain("height: auto !important;");
      expect(doc).toContain("Formulário da Campanha");
    });

    it("should inject vortex-preview-safety into full HTML documents with head tag", () => {
      const raw = `<!DOCTYPE html><html><head><title>Test</title></head><body><div class="min-h-screen">Content</div></body></html>`;
      const doc = buildPreviewDoc(raw, 800);

      expect(doc).toContain("id=\"vortex-preview-safety\"");
      expect(doc).toContain("--vortex-viewport-h: 800px;");
      expect(doc).toContain("<title>Test</title>");
    });

    it("should prepend vortex-preview-safety if full HTML document lacks head tag", () => {
      const raw = `<html><body><div class="min-h-screen">Content</div></body></html>`;
      const doc = buildPreviewDoc(raw, 800);

      expect(doc).toContain("id=\"vortex-preview-safety\"");
      expect(doc).toContain("--vortex-viewport-h: 800px;");
    });

    it("should return empty string if rawHtml is empty or missing", () => {
      expect(buildPreviewDoc("")).toBe("");
      expect(buildPreviewDoc(undefined)).toBe("");
    });
  });

  describe("clampIframeHeight & Loop Prevention", () => {
    it("should clamp insane runaway height (e.g. 43536px) to max limit (10000px)", () => {
      const insaneHeight = 43536;
      const clamped = clampIframeHeight(insaneHeight, 800, 10000);
      expect(clamped).toBe(10000);
    });

    it("should enforce minimum height when content is smaller than viewport", () => {
      const tinyContent = 150;
      const clamped = clampIframeHeight(tinyContent, 844, 10000);
      expect(clamped).toBe(844);
    });

    it("should preserve valid realistic content height", () => {
      const validHeight = 2450;
      const clamped = clampIframeHeight(validHeight, 800, 10000);
      expect(clamped).toBe(2450);
    });

    it("should handle NaN or negative values gracefully", () => {
      expect(clampIframeHeight(NaN, 800)).toBe(800);
      expect(clampIframeHeight(-500, 800)).toBe(800);
    });
  });

  describe("shouldUpdateHeight (Hysteresis & Anti-Jitter)", () => {
    it("should ignore minor fluctuations below threshold (< 16px)", () => {
      expect(shouldUpdateHeight(1200, 1205, 16)).toBe(false);
      expect(shouldUpdateHeight(1200, 1215, 16)).toBe(false);
      expect(shouldUpdateHeight(1200, 1190, 16)).toBe(false);
    });

    it("should accept real dimension changes (>= 16px)", () => {
      expect(shouldUpdateHeight(1200, 1216, 16)).toBe(true);
      expect(shouldUpdateHeight(1200, 2400, 16)).toBe(true);
      expect(shouldUpdateHeight(2400, 800, 16)).toBe(true);
    });
  });

  describe("getSafeCanvasDimensions (Crash & Freeze Prevention)", () => {
    it("should safely compute dimensions for normal height", () => {
      const { canvasWidth, canvasHeight, styleWidth, styleHeight, scaleY, dpr } =
        getSafeCanvasDimensions(1140, 850, 2);

      expect(styleWidth).toBe(1140);
      expect(styleHeight).toBe(850);
      expect(dpr).toBe(1.5); // Capped at 1.5 to save GPU RAM
      expect(canvasWidth).toBe(Math.round(1140 * 1.5));
      expect(canvasHeight).toBe(Math.round(850 * 1.5));
      expect(scaleY).toBe(1);
    });

    it("should clamp canvas height if dimension approaches GPU texture limit", () => {
      // Suppose an extreme 10000px page
      const { canvasHeight, styleHeight, scaleY } = getSafeCanvasDimensions(1140, 10000, 2);

      expect(styleHeight).toBe(10000);
      // Canvas height texture capped at max 8192 * dpr
      expect(canvasHeight).toBe(Math.round(8192 * 1.5));
      expect(scaleY).toBeCloseTo(8192 / 10000, 3);
    });

    it("should clamp insane 43536px height to safe canvas allocation", () => {
      const { canvasHeight, styleHeight } = getSafeCanvasDimensions(1140, 43536, 3);

      expect(styleHeight).toBe(43536);
      expect(canvasHeight).toBeLessThanOrEqual(8192 * 1.5);
    });
  });
});
