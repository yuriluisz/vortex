import { describe, it, expect } from "vitest";

export function validateAndCleanGtmId(id: unknown): string | null | undefined {
  if (id === null || id === undefined || id === "") return undefined;
  if (typeof id !== "string") throw new Error("GTM ID must be a string");
  
  const trimmed = id.trim().toUpperCase();
  if (trimmed === "") return undefined;
  
  if (!/^GTM-[A-Z0-9]+$/.test(trimmed)) {
    throw new Error("Formato de Google Tag Manager ID inválido (deve ser GTM-XXXXXXX)");
  }
  return trimmed;
}

describe("GTM ID Validation", () => {
  it("accepts valid GTM IDs in various formats and normalizes them", () => {
    expect(validateAndCleanGtmId("GTM-ABC1234")).toBe("GTM-ABC1234");
    expect(validateAndCleanGtmId("gtm-xyz999")).toBe("GTM-XYZ999");
    expect(validateAndCleanGtmId(" GTM-K893J4  ")).toBe("GTM-K893J4");
  });

  it("handles empty or falsy values gracefully", () => {
    expect(validateAndCleanGtmId(null)).toBeUndefined();
    expect(validateAndCleanGtmId(undefined)).toBeUndefined();
    expect(validateAndCleanGtmId("")).toBeUndefined();
    expect(validateAndCleanGtmId("   ")).toBeUndefined();
  });

  it("rejects invalid GTM IDs", () => {
    expect(() => validateAndCleanGtmId("123456")).toThrow();
    expect(() => validateAndCleanGtmId("<script>alert(1)</script>")).toThrow();
    expect(() => validateAndCleanGtmId("GTM-")).toThrow();
    expect(() => validateAndCleanGtmId("GTM-abc!@#")).toThrow();
    expect(() => validateAndCleanGtmId("GTM XXXXX")).toThrow();
  });
});
