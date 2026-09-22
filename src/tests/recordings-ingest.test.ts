import { describe, it, expect, vi, beforeEach } from "vitest";
import { gzipSync } from "node:zlib";

vi.mock("server-only", () => ({}));

const mockPrisma = {
  campaign: {
    findUnique: vi.fn(),
  },
  sessionRecording: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  heatmapClick: {
    createMany: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

const mockUploadReplay = vi.fn().mockResolvedValue("replays/camp-1/sess-1.json.gz");
vi.mock("@/lib/r2", () => ({
  uploadReplayPayload: mockUploadReplay,
}));

describe("POST /api/analytics/recordings/ingest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject requests with invalid or missing session/campaign ID", async () => {
    const { POST } = await import("@/app/api/analytics/recordings/ingest/route");

    const req1 = new Request("http://localhost/api/analytics/recordings/ingest", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res1 = await POST(req1 as any);
    expect(res1.status).toBe(400);

    const req2 = new Request("http://localhost/api/analytics/recordings/ingest", {
      method: "POST",
      body: JSON.stringify({ campaignId: "valid_camp", sessionId: "bad/session/id!!" }),
    });
    const res2 = await POST(req2 as any);
    expect(res2.status).toBe(400);
  });

  it("should allow ULTRA plans to ingest recording and clamp coordinates", async () => {
    mockPrisma.campaign.findUnique.mockResolvedValueOnce({
      id: "camp_123",
      active: true,
      sessionRecordingEnabled: true,
      tenant: { id: "tenant_abc", plan: "ULTRA" },
    });
    mockPrisma.sessionRecording.findUnique.mockResolvedValueOnce(null);
    mockPrisma.sessionRecording.upsert.mockResolvedValueOnce({});
    mockPrisma.heatmapClick.createMany.mockResolvedValueOnce({ count: 2 });

    const rawEvents = [{ type: 2, timestamp: 1000, data: {} }];
    const gzipped = gzipSync(Buffer.from(JSON.stringify(rawEvents))).toString("base64");

    const { POST } = await import("@/app/api/analytics/recordings/ingest/route");
    const req = new Request("http://localhost/api/analytics/recordings/ingest", {
      method: "POST",
      body: JSON.stringify({
        campaignId: "camp_123",
        sessionId: "sess_456",
        duration: 70,
        clicksCount: 3,
        gzip: gzipped,
        clicks: [
          { x: -5, y: 150 }, // Fora do intervalo -> deve sofrer clamp
          { x: 45.2, y: 88.7 },
        ],
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);

    // Verificar clamp dos cliques
    expect(mockPrisma.heatmapClick.createMany).toHaveBeenCalledWith({
      data: [
        { campaignId: "camp_123", x: 0, y: 100, device: "mobile" },
        { campaignId: "camp_123", x: 45.2, y: 88.7, device: "mobile" },
      ],
    });

    // Upload no R2 efetuado
    expect(mockUploadReplay).toHaveBeenCalled();
  });

  it("should enforce monotonic duration and prevent overwriting longer recordings with shorter ones", async () => {
    mockPrisma.campaign.findUnique.mockResolvedValueOnce({
      id: "camp_123",
      active: true,
      sessionRecordingEnabled: true,
      tenant: { id: "tenant_abc", plan: "ULTRA" },
    });
    // Sessão já registrada com 70s
    mockPrisma.sessionRecording.findUnique.mockResolvedValueOnce({
      duration: 70,
      clicksCount: 15,
    });
    mockPrisma.sessionRecording.upsert.mockResolvedValueOnce({});

    const rawEvents = [{ type: 2, timestamp: 1000, data: {} }];
    const gzipped = gzipSync(Buffer.from(JSON.stringify(rawEvents))).toString("base64");

    const { POST } = await import("@/app/api/analytics/recordings/ingest/route");
    const req = new Request("http://localhost/api/analytics/recordings/ingest", {
      method: "POST",
      body: JSON.stringify({
        campaignId: "camp_123",
        sessionId: "sess_456",
        duration: 1, // Pacote tardio regressivo de 1s
        clicksCount: 2,
        gzip: gzipped,
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    // R2 NÃO deve ter sido sobrescrito porque a gravação existente tem 70s > 1s
    expect(mockUploadReplay).not.toHaveBeenCalled();

    // Metadados preservam duration = 70s e clicksCount = 15
    expect(mockPrisma.sessionRecording.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          duration: 70,
          clicksCount: 15,
        }),
      })
    );
  });
});
