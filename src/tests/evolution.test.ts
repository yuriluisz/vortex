import { describe, it, expect, vi, beforeEach } from "vitest";
import { createInstance, getQRCode, getConnectionState } from "../lib/evolution";

vi.mock("server-only", () => ({}));

describe("Evolution API Client", () => {
  let fetchMock: any;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.EVOLUTION_API_URL = "http://evolution.local";
    process.env.EVOLUTION_API_KEY = "evo-key";

    fetchMock = vi.spyOn(global, "fetch").mockImplementation(async () => {
      return {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ success: true }),
      } as Response;
    });
  });

  it("should create an instance correctly", async () => {
    fetchMock.mockImplementationOnce(async () => {
      return {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({
          instance: { instanceName: "test-instance", status: "created" },
          hash: "abc",
        }),
      } as Response;
    });

    const result = await createInstance("test-instance", "5511999999999");

    expect(result.instance.instanceName).toBe("test-instance");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://evolution.local/instance/create",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          instanceName: "test-instance",
          number: "5511999999999",
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
        headers: expect.objectContaining({
          apikey: "test-evo-key",
        }),
      })
    );
  });

  it("should get QR Code correctly", async () => {
    fetchMock.mockImplementationOnce(async () => {
      return {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ base64: "data:image/png;base64,123" }),
      } as Response;
    });

    const result = await getQRCode("test-instance");

    expect(result.base64).toBe("data:image/png;base64,123");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://evolution.local/instance/connect/test-instance",
      expect.objectContaining({
        headers: expect.objectContaining({
          apikey: "test-evo-key",
        }),
      })
    );
  });

  it("should throw an error if API request fails", async () => {
    fetchMock.mockImplementationOnce(async () => {
      return {
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      } as Response;
    });

    await expect(getConnectionState("test-instance")).rejects.toThrow(
      "Evolution API error [400] /instance/connectionState/test-instance: Bad Request"
    );
  });
});
