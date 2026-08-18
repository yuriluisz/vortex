import { describe, it, expect } from "vitest";
import {
  cleanDigits,
  normalizePhoneNumber,
  extractDDD,
  extractBaseNumber,
  extractPhoneVariants,
  matchesPhoneNumber,
} from "../lib/phone-utils";

describe("phone-utils", () => {
  describe("cleanDigits", () => {
    it("should remove all non-digit characters", () => {
      expect(cleanDigits("(11) 98765-4321")).toBe("11987654321");
      expect(cleanDigits("+55 (11) 98765-4321")).toBe("5511987654321");
      expect(cleanDigits("")).toBe("");
      expect(cleanDigits(null)).toBe("");
    });
  });

  describe("normalizePhoneNumber", () => {
    it("should add 55 to 11-digit brazilian numbers", () => {
      expect(normalizePhoneNumber("11987654321")).toBe("5511987654321");
      expect(normalizePhoneNumber("(11) 98765-4321")).toBe("5511987654321");
    });

    it("should add 55 to 10-digit brazilian numbers (without 9th digit)", () => {
      expect(normalizePhoneNumber("1187654321")).toBe("551187654321");
      expect(normalizePhoneNumber("(11) 8765-4321")).toBe("551187654321");
    });

    it("should remove leading zero from national format", () => {
      expect(normalizePhoneNumber("011987654321")).toBe("5511987654321");
    });

    it("should keep already complete 55 numbers", () => {
      expect(normalizePhoneNumber("5511987654321")).toBe("5511987654321");
      expect(normalizePhoneNumber("+55 11 98765-4321")).toBe("5511987654321");
    });
  });

  describe("extractDDD and extractBaseNumber", () => {
    it("should extract DDD correctly", () => {
      expect(extractDDD("5511987654321")).toBe("11");
      expect(extractDDD("552187654321")).toBe("21");
      expect(extractDDD("11987654321")).toBe("11");
      expect(extractDDD("2187654321")).toBe("21");
      expect(extractDDD("(31) 99999-9999")).toBe("31");
    });

    it("should extract base 8-digit number", () => {
      expect(extractBaseNumber("5511987654321")).toBe("87654321");
      expect(extractBaseNumber("(11) 98765-4321")).toBe("87654321");
      expect(extractBaseNumber("1187654321")).toBe("87654321");
    });
  });

  describe("extractPhoneVariants", () => {
    it("should include masked and unmasked variants", () => {
      const variants = extractPhoneVariants("5511987654321");
      expect(variants).toContain("5511987654321");
      expect(variants).toContain("11987654321");
      expect(variants).toContain("(11) 98765-4321");
      expect(variants).toContain("98765-4321");
      expect(variants).toContain("8765-4321");
      expect(variants).toContain("87654321");
    });

    it("should generate variants from a masked input", () => {
      const variants = extractPhoneVariants("(11) 98765-4321");
      expect(variants).toContain("5511987654321");
      expect(variants).toContain("11987654321");
      expect(variants).toContain("87654321");
    });
  });

  describe("matchesPhoneNumber", () => {
    it("should match masked lead with WhatsApp JID clean number", () => {
      const leadPhone = "(11) 98765-4321";
      const whatsappJidPhone = "5511987654321";
      expect(matchesPhoneNumber(leadPhone, whatsappJidPhone)).toBe(true);
    });

    it("should match lead with 9th digit and WhatsApp without 9th digit", () => {
      const leadPhone = "(11) 98765-4321";
      const whatsappJidPhone = "551187654321"; // Old whatsapp format without 9
      expect(matchesPhoneNumber(leadPhone, whatsappJidPhone)).toBe(true);
    });

    it("should match lead without 9th digit and WhatsApp with 9th digit", () => {
      const leadPhone = "(11) 8765-4321";
      const whatsappJidPhone = "5511987654321";
      expect(matchesPhoneNumber(leadPhone, whatsappJidPhone)).toBe(true);
    });

    it("should match lead with +55 prefix and spaces", () => {
      const leadPhone = "+55 (11) 98765-4321";
      const whatsappJidPhone = "5511987654321";
      expect(matchesPhoneNumber(leadPhone, whatsappJidPhone)).toBe(true);
    });

    it("should NOT match numbers with different DDDs", () => {
      const leadPhone = "(11) 98765-4321";
      const whatsappJidPhone = "5521987654321"; // DDD 21 instead of 11
      expect(matchesPhoneNumber(leadPhone, whatsappJidPhone)).toBe(false);
    });

    it("should NOT match numbers with different base digits", () => {
      const leadPhone = "(11) 98765-4321";
      const whatsappJidPhone = "5511911112222";
      expect(matchesPhoneNumber(leadPhone, whatsappJidPhone)).toBe(false);
    });
  });
});
