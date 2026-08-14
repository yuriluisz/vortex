import { describe, it, expect, vi, beforeEach } from "vitest";
import { addCustomHostname, removeCustomHostname, getCustomHostnameStatus } from "../services/cloudflare.service";

describe("Cloudflare API Integration", () => {
  let fetchMock: any;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.CLOUDFLARE_API_TOKEN = "cf-token";
    process.env.CLOUDFLARE_ZONE_ID = "cf-zone-id";

    fetchMock = vi.spyOn(global, "fetch").mockImplementation(async () => {
      return {
        ok: true,
        json: async () => ({ success: true, result: { id: "host-id" } }),
      } as Response;
    });
  });

  it("should add a custom hostname", async () => {
    const result = await addCustomHostname("evento.meudominio.com.br");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/zones/cf-zone-id/custom_hostnames",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"hostname":"evento.meudominio.com.br"'),
        headers: expect.objectContaining({
          Authorization: "Bearer cf-token",
        }),
      })
    );
    expect(result.id).toBe("host-id");
  });

  it("should remove a custom hostname by first searching for its ID", async () => {
    fetchMock.mockImplementationOnce(async () => {
      // Retorna a busca do searchResponse
      return {
        ok: true,
        json: async () => ({
          success: true,
          result: [{ hostname: "evento.excluir.com.br", id: "host-123" }],
        }),
      } as Response;
    });
    
    fetchMock.mockImplementationOnce(async () => {
      // Retorna a exclusão (DELETE)
      return {
        ok: true,
        json: async () => ({ success: true }),
      } as Response;
    });

    await removeCustomHostname("evento.excluir.com.br");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://api.cloudflare.com/client/v4/zones/cf-zone-id/custom_hostnames?hostname=evento.excluir.com.br",
      expect.objectContaining({ method: "GET" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://api.cloudflare.com/client/v4/zones/cf-zone-id/custom_hostnames/host-123",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("should check hostname status correctly", async () => {
    fetchMock.mockImplementationOnce(async () => {
      return {
        ok: true,
        json: async () => ({
          success: true,
          result: [{ hostname: "evento.status.com.br", status: "active" }],
        }),
      } as Response;
    });

    const status = await getCustomHostnameStatus("evento.status.com.br");

    expect(status).toBe("active");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
