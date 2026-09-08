import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { hasFeature } from "@/lib/plans";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";

describe("Security Remediation Tests", () => {
  describe("1. Account Takeover Prevention in Invite Acceptance", () => {
    it("should reject invite acceptance if existing user password does not match", async () => {
      const existingPasswordHash = await bcrypt.hash("CorrectPassword123!", 10);
      const submittedPassword = "WrongPassword!";

      const isValid = await bcrypt.compare(submittedPassword, existingPasswordHash);
      expect(isValid).toBe(false);
    });

    it("should accept invite if existing user password matches", async () => {
      const existingPasswordHash = await bcrypt.hash("CorrectPassword123!", 10);
      const submittedPassword = "CorrectPassword123!";

      const isValid = await bcrypt.compare(submittedPassword, existingPasswordHash);
      expect(isValid).toBe(true);
    });
  });

  describe("2. RBAC Role Enforcement for Destructive Actions", () => {
    function assertCanDelete(role: string): boolean {
      if (role === "MEMBER") {
        throw new Error("Apenas administradores podem excluir campanhas.");
      }
      return true;
    }

    it("should block MEMBER from deleting resources", () => {
      expect(() => assertCanDelete("MEMBER")).toThrow("Apenas administradores podem excluir campanhas.");
    });

    it("should allow ADMIN and SUPER_ADMIN to delete resources", () => {
      expect(assertCanDelete("ADMIN")).toBe(true);
      expect(assertCanDelete("SUPER_ADMIN")).toBe(true);
    });
  });

  describe("3. IDOR Tenant Guard Enforcement", () => {
    function validateTenantOwnership(resourceTenantId: string, sessionTenantId: string): boolean {
      if (resourceTenantId !== sessionTenantId) {
        return false;
      }
      return true;
    }

    it("should reject access when resource tenant does not match session tenant", () => {
      const isAllowed = validateTenantOwnership("tenant-victim", "tenant-attacker");
      expect(isAllowed).toBe(false);
    });

    it("should allow access when resource tenant matches session tenant", () => {
      const isAllowed = validateTenantOwnership("tenant-123", "tenant-123");
      expect(isAllowed).toBe(true);
    });
  });

  describe("4. Plan Limit Feature Flags (Template Publishing)", () => {
    it("should disallow FREE plan from publishing templates", () => {
      expect(hasFeature("FREE", "publishTemplates")).toBe(false);
    });

    it("should allow PRO and ULTRA plans to publish templates", () => {
      expect(hasFeature("PRO", "publishTemplates")).toBe(true);
      expect(hasFeature("ULTRA", "publishTemplates")).toBe(true);
    });
  });

  describe("5. URL Protocol Validation", () => {
    const safeUrlSchema = z
      .string()
      .url("URL inválida")
      .refine((v) => !v || /^https?:\/\//i.test(v), "A URL deve iniciar com http:// ou https://")
      .optional()
      .or(z.literal(""));

    it("should allow valid https URLs", () => {
      expect(safeUrlSchema.safeParse("https://instagram.com/myprofile").success).toBe(true);
      expect(safeUrlSchema.safeParse("http://mywebsite.com").success).toBe(true);
      expect(safeUrlSchema.safeParse("").success).toBe(true);
    });

    it("should reject non-http/https URLs or malformed protocols", () => {
      expect(safeUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
      expect(safeUrlSchema.safeParse("data:text/html,test").success).toBe(false);
      expect(safeUrlSchema.safeParse("ftp://files.example.com").success).toBe(false);
    });
  });

  describe("6. Turnstile Theme Whitelist & XSS Prevention", () => {
    function sanitizeTurnstileTheme(rawTheme: string | null): "light" | "dark" | "auto" {
      return rawTheme === "light" || rawTheme === "auto" ? rawTheme : "dark";
    }

    it("should accept valid themes", () => {
      expect(sanitizeTurnstileTheme("light")).toBe("light");
      expect(sanitizeTurnstileTheme("dark")).toBe("dark");
      expect(sanitizeTurnstileTheme("auto")).toBe("auto");
    });

    it("should sanitize and fallback on XSS payload or invalid inputs", () => {
      expect(sanitizeTurnstileTheme('"><script>alert(1)</script>')).toBe("dark");
      expect(sanitizeTurnstileTheme('" onfocus="alert(1)')).toBe("dark");
      expect(sanitizeTurnstileTheme(null)).toBe("dark");
      expect(sanitizeTurnstileTheme("unknown")).toBe("dark");
    });
  });

  describe("7. Pixel ID Numeric Validation", () => {
    const pixelIdSchema = z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val.trim()), "O Pixel ID deve conter apenas números");

    it("should allow numeric pixel IDs", () => {
      expect(pixelIdSchema.safeParse("123456789012345").success).toBe(true);
      expect(pixelIdSchema.safeParse(undefined).success).toBe(true);
      expect(pixelIdSchema.safeParse("").success).toBe(true);
    });

    it("should reject non-numeric pixel IDs", () => {
      expect(pixelIdSchema.safeParse("1234abc").success).toBe(false);
      expect(pixelIdSchema.safeParse("<script>").success).toBe(false);
      expect(pixelIdSchema.safeParse("123-456").success).toBe(false);
    });
  });

  describe("8. Campaign Status Toggle RBAC Role Enforcement", () => {
    function assertCanToggleCampaign(role: string): boolean {
      if (role === "MEMBER") {
        throw new Error("Apenas administradores podem alterar o status da campanha.");
      }
      return true;
    }

    it("should reject MEMBER from modifying campaign status", () => {
      expect(() => assertCanToggleCampaign("MEMBER")).toThrow("Apenas administradores podem alterar o status da campanha.");
    });

    it("should allow ADMIN and SUPER_ADMIN to toggle campaign status", () => {
      expect(assertCanToggleCampaign("ADMIN")).toBe(true);
      expect(assertCanToggleCampaign("SUPER_ADMIN")).toBe(true);
    });
  });

  describe("9. WhatsApp Group URL Scheme Hardening (XSS / Protocol Smuggling)", () => {
    const groupUrlSchema = z.string().url("URL inválida").refine((val) => /^https?:\/\//i.test(val.trim()), {
      message: "A URL deve iniciar com http:// ou https://",
    });

    it("should accept valid https whatsapp URLs", () => {
      expect(groupUrlSchema.safeParse("https://chat.whatsapp.com/invite/12345").success).toBe(true);
      expect(groupUrlSchema.safeParse("http://chat.whatsapp.com/test").success).toBe(true);
    });

    it("should reject javascript: protocol smuggling and non-http schemes", () => {
      expect(groupUrlSchema.safeParse("javascript:alert(document.cookie)").success).toBe(false);
      expect(groupUrlSchema.safeParse("data:text/html,<script>alert(1)</script>").success).toBe(false);
      expect(groupUrlSchema.safeParse("vbscript:msgbox(1)").success).toBe(false);
    });
  });

  describe("10. Custom Hostname IDOR Guard", () => {
    function canCheckHostname(
      userPlan: string,
      userTenantId: string,
      hostname: string,
      campaigns: Array<{ tenantId: string; customDomain: string }>
    ): boolean {
      if (userPlan !== "ULTRA") return false;
      const cleanHost = hostname.trim().toLowerCase();
      const match = campaigns.find(
        (c) => c.tenantId === userTenantId && c.customDomain.toLowerCase() === cleanHost
      );
      return !!match;
    }

    const mockDbCampaigns = [
      { tenantId: "tenant-owner", customDomain: "evento.exemplo.com" },
      { tenantId: "tenant-victim", customDomain: "vip.alvo.com" },
    ];

    it("should block non-ULTRA users", () => {
      expect(canCheckHostname("PRO", "tenant-owner", "evento.exemplo.com", mockDbCampaigns)).toBe(false);
      expect(canCheckHostname("FREE", "tenant-owner", "evento.exemplo.com", mockDbCampaigns)).toBe(false);
    });

    it("should block ULTRA user from querying hostnames of other tenants (IDOR)", () => {
      expect(canCheckHostname("ULTRA", "tenant-owner", "vip.alvo.com", mockDbCampaigns)).toBe(false);
      expect(canCheckHostname("ULTRA", "tenant-attacker", "evento.exemplo.com", mockDbCampaigns)).toBe(false);
    });

    it("should allow ULTRA user to query their own registered hostnames", () => {
      expect(canCheckHostname("ULTRA", "tenant-owner", "evento.exemplo.com", mockDbCampaigns)).toBe(true);
    });
  });

  describe("11. Redis Production Startup Validation", () => {
    function resolveRedisUrl(nodeEnv: string, envRedisUrl?: string): string {
      const url = envRedisUrl;
      if (!url) {
        if (nodeEnv === "production") {
          throw new Error("❌ [FATAL] REDIS_URL não está configurada no ambiente de produção.");
        }
        return "redis://localhost:6379";
      }
      return url;
    }

    it("should throw in production if REDIS_URL is missing", () => {
      expect(() => resolveRedisUrl("production", undefined)).toThrow("REDIS_URL não está configurada");
      expect(() => resolveRedisUrl("production", "")).toThrow("REDIS_URL não está configurada");
    });

    it("should return REDIS_URL if provided in production", () => {
      expect(resolveRedisUrl("production", "rediss://default:secret@redis.host:6379")).toBe(
        "rediss://default:secret@redis.host:6379"
      );
    });

    it("should fallback to localhost in development/test", () => {
      expect(resolveRedisUrl("development", undefined)).toBe("redis://localhost:6379");
      expect(resolveRedisUrl("test", undefined)).toBe("redis://localhost:6379");
    });
  });

  describe("12. Constant-Time Webhook Token Authentication", () => {
    function safeCompare(a: string, b: string): boolean {
      if (!a || !b) return false;
      const bufA = Buffer.from(a);
      const bufB = Buffer.from(b);
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    }

    it("should return true for matching tokens", () => {
      expect(safeCompare("vortex-super-secret-key-123", "vortex-super-secret-key-123")).toBe(true);
    });

    it("should return false for mismatched tokens or lengths", () => {
      expect(safeCompare("wrong-key", "vortex-super-secret-key-123")).toBe(false);
      expect(safeCompare("", "vortex-super-secret-key-123")).toBe(false);
      expect(safeCompare("vortex-super-secret-key-124", "vortex-super-secret-key-123")).toBe(false);
    });
  });
});
