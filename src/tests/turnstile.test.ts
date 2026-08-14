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

describe("Turnstile Security Validation", () => {
  let fetchMock: any;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.CLOUDFLARE_TURNSTILE_SECRET = "secret-key";
    fetchMock = vi.spyOn(global, "fetch").mockImplementation(async () => {
      return {
        json: async () => ({ success: true, hostname: "localhost" }),
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
      formData.append("cf-turnstile-response", token);
    }
    return formData;
  }

  it("should reject submission if Turnstile secret is configured but no token is provided", async () => {
    const formData = createFormData(); // Sem token
    const result = await submitLeadAction(undefined, formData);
    
    expect(result?.error).toBe("Por favor, complete a verificação de segurança antes de continuar.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should reject submission if Cloudflare validation fails", async () => {
    // Simulando falha na Cloudflare (ex: token inválido)
    fetchMock.mockImplementationOnce(async () => {
      return {
        json: async () => ({ success: false, "error-codes": ["invalid-input-response"] }),
      } as Response;
    });

    const formData = createFormData("invalid-token");
    const result = await submitLeadAction(undefined, formData);
    
    expect(result?.error).toBe("Verificação de segurança falhou. Atualize a página e tente novamente.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should reject submission on network error during validation", async () => {
    fetchMock.mockRejectedValueOnce(new Error("Network Error"));

    const formData = createFormData("some-token");
    const result = await submitLeadAction(undefined, formData);
    
    expect(result?.error).toBe("Falha na verificação de segurança (rede).");
  });

  it("should accept submission if Turnstile token is valid", async () => {
    const formData = createFormData("valid-token");
    const result = await submitLeadAction(undefined, formData);
    
    // Sucesso retorna undefined ou { success: true }
    expect(result?.error).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
