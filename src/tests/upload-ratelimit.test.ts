import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockExec = vi.fn();
const mockPipeline = {
  zremrangebyscore: vi.fn().mockReturnThis(),
  zadd: vi.fn().mockReturnThis(),
  zcard: vi.fn().mockReturnThis(),
  expire: vi.fn().mockReturnThis(),
  exec: mockExec,
};

vi.mock("@/lib/redis", () => ({
  redis: {
    pipeline: vi.fn(() => mockPipeline),
  },
}));

import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

describe("Upload and Publishing Rate Limiting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have correct rate limit configurations defined", () => {
    expect(RATE_LIMITS.AVATAR_UPLOAD).toEqual({
      windowSeconds: 60,
      maxRequests: 5,
    });
    expect(RATE_LIMITS.TEMPLATE_PUBLISH).toEqual({
      windowSeconds: 60,
      maxRequests: 10,
    });
  });

  it("should allow request when within avatar upload limit (e.g. 3rd request)", async () => {
    mockExec.mockResolvedValueOnce([
      [null, 0],
      [null, 1],
      [null, 3], // 3 requests counted
      [null, 1],
    ]);

    const result = await rateLimit("upload_avatar:user-123", RATE_LIMITS.AVATAR_UPLOAD);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("should block request when avatar upload limit is exceeded (e.g. 6th request)", async () => {
    mockExec.mockResolvedValueOnce([
      [null, 0],
      [null, 1],
      [null, 6], // 6 requests counted
      [null, 1],
    ]);

    const result = await rateLimit("upload_avatar:user-123", RATE_LIMITS.AVATAR_UPLOAD);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should block request when template publish limit is exceeded (e.g. 11th request)", async () => {
    mockExec.mockResolvedValueOnce([
      [null, 0],
      [null, 1],
      [null, 11], // 11 requests counted
      [null, 1],
    ]);

    const result = await rateLimit("publish_template:user-123", RATE_LIMITS.TEMPLATE_PUBLISH);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should fail-closed if redis pipeline fails", async () => {
    mockExec.mockResolvedValueOnce(null);

    const result = await rateLimit("upload_avatar:user-123", RATE_LIMITS.AVATAR_UPLOAD);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
