import { describe, it, expect } from "vitest";
import {
  getDeviceForViewport,
  getThermalRadius,
  calculatePointCoordinates,
  buildPreviewDoc,
} from "@/components/admin/recordings/HeatmapView";

describe("HeatmapView Component & Coordinate Calculations", () => {
  describe("getDeviceForViewport", () => {
    it("should map desktop viewport to desktop filter", () => {
      expect(getDeviceForViewport("desktop")).toBe("desktop");
    });

    it("should map tablet and mobile viewports to mobile filter", () => {
      expect(getDeviceForViewport("tablet")).toBe("mobile");
      expect(getDeviceForViewport("mobile")).toBe("mobile");
    });
  });

  describe("getThermalRadius", () => {
    it("should return larger radius for desktop and compact for mobile/tablet", () => {
      expect(getThermalRadius("desktop")).toBe(28);
      expect(getThermalRadius("mobile")).toBe(22);
      expect(getThermalRadius("tablet")).toBe(22);
    });
  });

  describe("calculatePointCoordinates", () => {
    it("should calculate exact pixel coordinates from percentage values", () => {
      const { px, py } = calculatePointCoordinates(50, 25, 1000, 2000);
      expect(px).toBe(500);
      expect(py).toBe(500);
    });

    it("should clamp values between 0 and 100%", () => {
      const { px, py } = calculatePointCoordinates(-20, 150, 400, 800);
      expect(px).toBe(0);
      expect(py).toBe(800);
    });

    it("should handle boundary conditions and zero dimensions safely", () => {
      const { px, py } = calculatePointCoordinates(0, 0, 0, 0);
      expect(px).toBe(0);
      expect(py).toBe(0);
    });
  });

  describe("buildPreviewDoc", () => {
    it("should inject link safety and form slot into HTML snippet", () => {
      const raw = `<div class="min-h-screen bg-black py-24"><h1>Titulo</h1>{{FORM_SLOT}}</div>`;
      const doc = buildPreviewDoc(raw);

      expect(doc).toContain("id=\"vortex-link-safety\"");
      expect(doc).toContain("Formulário da Campanha");
      expect(doc).toContain("<html lang=\"pt-BR\">");
    });

    it("should inject link safety into full HTML documents with head tag", () => {
      const raw = `<!DOCTYPE html><html><head><title>Test</title></head><body><div>Content</div></body></html>`;
      const doc = buildPreviewDoc(raw);

      expect(doc).toContain("id=\"vortex-link-safety\"");
      expect(doc).toContain("<title>Test</title>");
    });

    it("should return empty string if rawHtml is empty or missing", () => {
      expect(buildPreviewDoc("")).toBe("");
      expect(buildPreviewDoc(undefined)).toBe("");
    });
  });
});
