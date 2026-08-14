import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCustomer, createSubscription } from "../services/asaas.service";

describe("Asaas Payment Integration", () => {
  let fetchMock: any;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.ASAAS_API_URL = "https://sandbox.asaas.com/api/v3";
    process.env.ASAAS_API_KEY = "asaas-api-key";

    fetchMock = vi.spyOn(global, "fetch").mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({ success: true }),
      } as Response;
    });
  });

  it("should create a customer with correct payload", async () => {
    fetchMock.mockImplementationOnce(async () => {
      return {
        ok: true,
        json: async () => ({ id: "cus_000005030232" }),
      } as Response;
    });

    const result = await createCustomer("John Doe", "john@example.com", "12345678909");

    expect(result.id).toBe("cus_000005030232");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://sandbox.asaas.com/api/v3/customers",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"name":"John Doe"'),
        headers: expect.objectContaining({
          access_token: "test-asaas-key",
        }),
      })
    );
  });

  it("should create a subscription with correct payload", async () => {
    fetchMock.mockImplementationOnce(async () => {
      return {
        ok: true,
        json: async () => ({
          id: "sub_123",
          invoiceUrl: "https://sandbox.asaas.com/i/123",
          bankSlipUrl: "https://sandbox.asaas.com/b/123",
          pixQrCodeUrl: "https://sandbox.asaas.com/p/123",
        }),
      } as Response;
    });

    const result = await createSubscription("cus_123", "ULTRA");

    expect(result.subscriptionId).toBe("sub_123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://sandbox.asaas.com/api/v3/subscriptions",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"customer":"cus_123"'),
      })
    );
  });

  it("should throw a detailed error when API returns 400 Bad Request", async () => {
    fetchMock.mockImplementationOnce(async () => {
      return {
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({
          errors: [{ description: "Invalid CPF" }],
        }),
      } as Response;
    });

    await expect(createCustomer("John", "j@j.com", "invalid-cpf")).rejects.toThrow(
      "ASAAS: Invalid CPF"
    );
  });
});
