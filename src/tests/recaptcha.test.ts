import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitLeadAction } from "../app/[slug]/actions";

// Mocks
vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Map([
    ["x-forwarded-for", "127.0.0.1"],
    ["cf-ipcountry", "BR"],
    ["user-agent", "Mozilla/5.0"],
  ])),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn(),
}));

vi.mock("@/lib/queue", () => ({
  leadsQueue: { add: vi.fn() },
  viewsQueue: { add: vi.fn() },
}));

vi.mock("@/lib/plans", () => ({
  canCreateResource: vi.fn(() => ({ allowed: true })),
  getLimitForPlan: vi.fn(() => -1),
  isUnlimited: vi.fn(() => true),
}));

vi.mock("@/lib/campaign-cache", () => ({
  getCachedCampaignData: vi.fn(async () => ({
    id: "campaign-123",
    tenantId: "tenant-123",
    active: true,
    plan: "FREE",
    customDomain: null,
  })),
  getCachedLeadCount: vi.fn(async () => 0),
}));

describe("reCAPTCHA v3 Security Validation", () => {
  let fetchMock: any;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.RECAPTCHA_SECRET_KEY = "secret-key";
    fetchMock = vi.spyOn(global, "fetch").mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({ success: true, score: 0.9, hostname: "localhost" }),
      } as Response;
    });
  });

  function createFormData(token?: string) {
    const formData = new FormData();
    formData.append("campaignId", "123e4567-e89b-12d3-a456-426614174000"); // UUID
    formData.append("slug", "test-campaign");
    formData.append("name", "Test User");
    formData.append("whatsapp", "11999999999");
    if (token !== undefined) {
      formData.append("g-recaptcha-response", token);
    }
    return formData;
  }

  it("should reject submission if reCAPTCHA secret is configured but no token is provided", async () => {
    const formData = createFormData(); // Sem token
    const result = await submitLeadAction(undefined, formData);
    
    expect(result?.error).toBe("Por favor, complete a verificação de segurança antes de continuar.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should reject submission if Google validation fails (success: false)", async () => {
    fetchMock.mockImplementationOnce(async () => {
      return {
        ok: true,
        json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }),
      } as Response;
    });

    const formData = createFormData("invalid-token");
    const result = await submitLeadAction(undefined, formData);
    
    expect(result?.error).toBe("Verificação de segurança falhou (score muito baixo). Tente novamente.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should reject submission if score is too low", async () => {
    fetchMock.mockImplementationOnce(async () => {
      return {
        ok: true,
        json: async () => ({ success: true, score: 0.1 }),
      } as Response;
    });

    const formData = createFormData("bot-token");
    const result = await submitLeadAction(undefined, formData);
    
    expect(result?.error).toBe("Verificação de segurança falhou (score muito baixo). Tente novamente.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should reject submission on network error during validation", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network Error"));

    const formData = createFormData("some-token");
    const result = await submitLeadAction(undefined, formData);
    
    expect(result?.error).toBe("Falha na verificação de segurança (rede).");
  });

  it("should accept submission if reCAPTCHA token is valid and score is high", async () => {
    const formData = createFormData("valid-token");
    const result = await submitLeadAction(undefined, formData);
    
    // Sucesso retorna undefined ou { success: true }
    expect(result?.error).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
