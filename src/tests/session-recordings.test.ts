import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    campaign: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    sessionRecording: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    heatmapClick: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    tenant: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/r2", () => ({
  uploadReplayPayload: vi.fn().mockImplementation((key: string) => Promise.resolve(key)),
  getReplayPayload: vi.fn(),
  deleteReplayPayload: vi.fn().mockResolvedValue(true),
  R2_BUCKET: "vortex",
  R2_PUBLIC_URL: "https://r2.vortexpages.online",
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: "user-1",
    email: "admin@vortex.com",
    tenantId: "tenant-ultra",
  }),
}));

describe("Session Recordings & Heatmap Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate that uploadReplayPayload is called with proper gzip key format", async () => {
    const { uploadReplayPayload } = await import("@/lib/r2");
    const testBuffer = Buffer.from("test payload");
    const key = "replays/camp-1/session-123.json.gz";

    const result = await uploadReplayPayload(key, testBuffer, "application/gzip");
    expect(uploadReplayPayload).toHaveBeenCalledWith(key, testBuffer, "application/gzip");
    expect(result).toBe(key);
  });

  it("should enforce ULTRA plan limit in plan configuration", async () => {
    const { PLAN_LIMITS } = await import("@/lib/plans");

    expect(PLAN_LIMITS.FREE.sessionRecording).toBe(false);
    expect(PLAN_LIMITS.PRO.sessionRecording).toBe(false);
    expect(PLAN_LIMITS.ULTRA.sessionRecording).toBe(true);
  });

  it("should process ingest endpoint and block when recording is disabled", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { POST } = await import("@/app/api/analytics/recordings/ingest/route");

    // Mock campanha inativa
    vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
      id: "camp-1",
      active: true,
      sessionRecordingEnabled: false,
      tenant: { id: "tenant-ultra", plan: "ULTRA" },
    } as unknown as never);

    const mockReq = {
      headers: new Headers(),
      json: async () => ({
        campaignId: "camp-1",
        sessionId: "s-123",
        events: [{ type: 2, data: {} }],
      }),
    };

    const res = await POST(mockReq as unknown as import("next/server").NextRequest);
    const data = await res.json();

    expect(data.ok).toBe(false);
    expect(data.reason).toBe("recording_disabled");
  });

  it("should process ingest and save to R2 and Prisma when enabled and ULTRA", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { uploadReplayPayload } = await import("@/lib/r2");
    const { POST } = await import("@/app/api/analytics/recordings/ingest/route");

    vi.mocked(prisma.campaign.findUnique).mockResolvedValue({
      id: "camp-1",
      active: true,
      sessionRecordingEnabled: true,
      tenant: { id: "tenant-ultra", plan: "ULTRA" },
    } as unknown as never);

    vi.mocked(prisma.sessionRecording.upsert).mockResolvedValue({
      id: "rec-1",
      sessionId: "s-123",
    } as unknown as never);

    vi.mocked(prisma.heatmapClick.createMany).mockResolvedValue({ count: 2 } as unknown as never);

    const mockReq = {
      headers: new Headers(),
      json: async () => ({
        campaignId: "camp-1",
        sessionId: "s-123",
        duration: 42,
        clicksCount: 2,
        clicks: [
          { x: 50.2, y: 30.1 },
          { x: 55.4, y: 32.8 },
        ],
        device: "mobile",
        browser: "Chrome",
        os: "Android",
        pageUrl: "https://vortexpages.online/quiz",
        events: [{ type: 2, data: {} }],
      }),
    };

    const res = await POST(mockReq as unknown as import("next/server").NextRequest);
    const data = await res.json();

    expect(data.ok).toBe(true);
    expect(data.sessionId).toBe("s-123");
    expect(uploadReplayPayload).toHaveBeenCalled();
    expect(prisma.sessionRecording.upsert).toHaveBeenCalled();
    expect(prisma.heatmapClick.createMany).toHaveBeenCalled();
  });
});
