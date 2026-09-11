process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockGetSession = vi.fn();
vi.mock("@/lib/session", () => ({
  getSession: () => mockGetSession(),
}));

const mockTemplateLikeFindUnique = vi.fn();
const mockTemplateLikeCreate = vi.fn();
const mockTemplateLikeDelete = vi.fn();
const mockTemplateUpdate = vi.fn();
const mockTemplateFindUnique = vi.fn();
const mockTransaction = vi.fn((actions) => Promise.all(actions));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    templateLike: {
      findUnique: (...args: unknown[]) => mockTemplateLikeFindUnique(...args),
      create: (...args: unknown[]) => mockTemplateLikeCreate(...args),
      delete: (...args: unknown[]) => mockTemplateLikeDelete(...args),
    },
    template: {
      update: (...args: unknown[]) => mockTemplateUpdate(...args),
      findUnique: (...args: unknown[]) => mockTemplateFindUnique(...args),
    },
    $transaction: (fnOrArr: unknown) => {
      if (typeof fnOrArr === "function") {
        return (fnOrArr as (tx: unknown) => unknown)({
          templateLike: {
            create: mockTemplateLikeCreate,
            delete: mockTemplateLikeDelete,
          },
          template: {
            update: mockTemplateUpdate,
          },
        });
      }
      return mockTransaction(fnOrArr);
    },
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
  })),
  headers: vi.fn(async () => ({
    get: vi.fn(),
  })),
}));

vi.mock("@/lib/redis", () => ({
  redis: {
    set: vi.fn(),
  },
}));

import { toggleTemplateLikeAction } from "@/app/templates/[slug]/actions";

describe("toggleTemplateLikeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fail if templateId is empty", async () => {
    const res = await toggleTemplateLikeAction("");
    expect(res).toEqual({
      success: false,
      liked: false,
      likeCount: 0,
      error: "INVALID_TEMPLATE",
    });
  });

  it("should return AUTH_REQUIRED if user is not logged in", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const res = await toggleTemplateLikeAction("tmpl-1");
    expect(res).toEqual({
      success: false,
      liked: false,
      likeCount: 0,
      error: "AUTH_REQUIRED",
    });
  });

  it("should like template if user has not liked it yet", async () => {
    mockGetSession.mockResolvedValueOnce({ userId: "user-123" });
    mockTemplateLikeFindUnique.mockResolvedValueOnce(null); // not liked yet
    mockTemplateFindUnique.mockResolvedValueOnce({ likeCount: 5 });

    const res = await toggleTemplateLikeAction("tmpl-1");

    expect(res).toEqual({
      success: true,
      liked: true,
      likeCount: 5,
    });
    expect(mockTemplateLikeCreate).toHaveBeenCalledWith({
      data: {
        templateId: "tmpl-1",
        userId: "user-123",
      },
    });
    expect(mockTemplateUpdate).toHaveBeenCalledWith({
      where: { id: "tmpl-1" },
      data: { likeCount: { increment: 1 } },
    });
  });

  it("should unlike template if user has already liked it", async () => {
    mockGetSession.mockResolvedValueOnce({ userId: "user-123" });
    mockTemplateLikeFindUnique.mockResolvedValueOnce({ id: "like-99" }); // already liked
    mockTemplateFindUnique.mockResolvedValueOnce({ likeCount: 4 });

    const res = await toggleTemplateLikeAction("tmpl-1");

    expect(res).toEqual({
      success: true,
      liked: false,
      likeCount: 4,
    });
    expect(mockTemplateLikeDelete).toHaveBeenCalledWith({
      where: { id: "like-99" },
    });
    expect(mockTemplateUpdate).toHaveBeenCalledWith({
      where: { id: "tmpl-1" },
      data: { likeCount: { decrement: 1 } },
    });
  });
});
