import { describe, it, expect } from "vitest";
import { formatGtmId, isValidGtmId } from "@/components/GoogleTagManager";

describe("GoogleTagManager Utilities", () => {
  it("validates and formats valid GTM IDs", () => {
    expect(isValidGtmId("GTM-TEST123")).toBe(true);
    expect(formatGtmId("GTM-TEST123")).toBe("GTM-TEST123");

    expect(isValidGtmId("gtm-abc999")).toBe(true);
    expect(formatGtmId("gtm-abc999")).toBe("GTM-ABC999");

    expect(isValidGtmId("  GTM-X999  ")).toBe(true);
    expect(formatGtmId("  GTM-X999  ")).toBe("GTM-X999");
  });

  it("handles null, undefined, empty string", () => {
    expect(isValidGtmId(null)).toBe(false);
    expect(formatGtmId(null)).toBeNull();

    expect(isValidGtmId(undefined)).toBe(false);
    expect(formatGtmId(undefined)).toBeNull();

    expect(isValidGtmId("")).toBe(false);
    expect(formatGtmId("")).toBeNull();

    expect(isValidGtmId("   ")).toBe(false);
    expect(formatGtmId("   ")).toBeNull();
  });

  it("rejects malformed or malicious IDs", () => {
    expect(isValidGtmId("12345678")).toBe(false);
    expect(formatGtmId("12345678")).toBeNull();

    expect(isValidGtmId("GTM-")).toBe(false);
    expect(formatGtmId("GTM-")).toBeNull();

    expect(isValidGtmId("<script>alert(1)</script>")).toBe(false);
    expect(formatGtmId("<script>alert(1)</script>")).toBeNull();

    expect(isValidGtmId("GTM-ABC!@#")).toBe(false);
    expect(formatGtmId("GTM-ABC!@#")).toBeNull();
  });
});
