process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieStore: Record<string, string | undefined> = {};
const mockCookies = {
  get: vi.fn((name: string) => {
    const val = mockCookieStore[name];
    return val !== undefined ? { name, value: val } : undefined;
  }),
  set: vi.fn((name: string, value: string) => {
    mockCookieStore[name] = value;
  }),
};

const mockHeaders = {
  get: vi.fn((key: string) => {
    if (key === "x-forwarded-for") return "192.168.1.100";
    return null;
  }),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookies),
  headers: vi.fn(async () => mockHeaders),
}));

const mockGetSession = vi.fn();
vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
}));

const mockRedisSet = vi.fn();
vi.mock("@/lib/redis", () => ({
  redis: {
    set: (...args: unknown[]) => mockRedisSet(...args),
  },
}));

const mockPrismaTemplateUpdate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    template: {
      update: (...args: unknown[]) => mockPrismaTemplateUpdate(...args),
    },
  },
}));

import { trackTemplateViewAction } from "@/app/templates/[slug]/actions";

describe("Template View Deduplication (trackTemplateViewAction)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of Object.keys(mockCookieStore)) {
      delete mockCookieStore[key];
    }
    mockGetSession.mockResolvedValue(null);
  });

  it("should fail gracefully if templateId is empty", async () => {
    const res = await trackTemplateViewAction("");
    expect(res).toEqual({ success: false, incremented: false });
    expect(mockPrismaTemplateUpdate).not.toHaveBeenCalled();
  });

  it("should NOT increment viewCount if current user is the author of the template", async () => {
    mockGetSession.mockResolvedValue({
      userId: "author-user-123",
      tenantId: "tenant-1",
      email: "author@test.com",
    });

    const res = await trackTemplateViewAction("tmpl-123", "author-user-123");

    expect(res).toEqual({ success: true, incremented: false });
    expect(mockRedisSet).not.toHaveBeenCalled();
    expect(mockPrismaTemplateUpdate).not.toHaveBeenCalled();
  });

  it("should NOT increment viewCount if browser cookie indicates template was already viewed", async () => {
    mockCookieStore["vortex_v_tmpl_tmpl-123"] = "1";

    const res = await trackTemplateViewAction("tmpl-123", "other-author");

    expect(res).toEqual({ success: true, incremented: false });
    expect(mockRedisSet).not.toHaveBeenCalled();
    expect(mockPrismaTemplateUpdate).not.toHaveBeenCalled();
  });

  it("should NOT increment viewCount if Redis indicates view already recorded in 24h window (cross-tab/anonymous)", async () => {
    mockRedisSet.mockResolvedValueOnce(null); // Key already existed (NX condition failed)

    const res = await trackTemplateViewAction("tmpl-123", "other-author");

    expect(res).toEqual({ success: true, incremented: false });
    expect(mockRedisSet).toHaveBeenCalledTimes(1);
    expect(mockPrismaTemplateUpdate).not.toHaveBeenCalled();
    // Should still set cookie to fast-path subsequent checks
    expect(mockCookies.set).toHaveBeenCalledWith(
      "vortex_v_tmpl_tmpl-123",
      "1",
      expect.objectContaining({ maxAge: 86400 })
    );
  });

  it("should increment viewCount once for a fresh unique visitor", async () => {
    mockRedisSet.mockResolvedValueOnce("OK"); // New key set successfully
    mockPrismaTemplateUpdate.mockResolvedValueOnce({ id: "tmpl-123", viewCount: 10 });

    const res = await trackTemplateViewAction("tmpl-123", "other-author");

    expect(res).toEqual({ success: true, incremented: true });
    expect(mockPrismaTemplateUpdate).toHaveBeenCalledWith({
      where: { id: "tmpl-123" },
      data: { viewCount: { increment: 1 } },
    });
    expect(mockCookies.set).toHaveBeenCalledWith(
      "vortex_v_tmpl_tmpl-123",
      "1",
      expect.objectContaining({ maxAge: 86400 })
    );
  });
});
