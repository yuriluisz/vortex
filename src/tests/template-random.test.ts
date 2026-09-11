process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockFindMany = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    template: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

vi.mock("@/lib/plans", () => ({
  hasFeature: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/notifications", () => ({
  sendTemplateStatusEmail: vi.fn(),
}));

import { getRandomPublishedTemplates } from "@/services/template.service";

describe("getRandomPublishedTemplates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return up to the requested limit of random published templates", async () => {
    const mockTemplates = [
      { id: "1", slug: "tmpl-1", name: "T1", description: "D1", thumbnailUrl: null, category: "EVENT", theme: "DARK", primaryColor: null },
      { id: "2", slug: "tmpl-2", name: "T2", description: "D2", thumbnailUrl: null, category: "ECOMMERCE", theme: "LIGHT", primaryColor: null },
      { id: "3", slug: "tmpl-3", name: "T3", description: "D3", thumbnailUrl: null, category: "PORTFOLIO", theme: "COLORFUL", primaryColor: null },
      { id: "4", slug: "tmpl-4", name: "T4", description: "D4", thumbnailUrl: null, category: "WEBINAR", theme: "DARK", primaryColor: null },
      { id: "5", slug: "tmpl-5", name: "T5", description: "D5", thumbnailUrl: null, category: "INFOPRODUCT", theme: "LIGHT", primaryColor: null },
    ];
    mockFindMany.mockResolvedValueOnce(mockTemplates);

    const result = await getRandomPublishedTemplates(3);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        thumbnailUrl: true,
        category: true,
        theme: true,
        primaryColor: true,
      },
    });
    expect(result).toHaveLength(3);
    // Every item in result must be from the mock list
    result.forEach((item) => {
      expect(mockTemplates.some((t) => t.id === item.id)).toBe(true);
    });
  });

  it("should return all templates if total published templates <= limit", async () => {
    const mockTemplates = [
      { id: "1", slug: "tmpl-1", name: "T1", description: "D1", thumbnailUrl: null, category: "EVENT", theme: "DARK", primaryColor: null },
      { id: "2", slug: "tmpl-2", name: "T2", description: "D2", thumbnailUrl: null, category: "ECOMMERCE", theme: "LIGHT", primaryColor: null },
    ];
    mockFindMany.mockResolvedValueOnce(mockTemplates);

    const result = await getRandomPublishedTemplates(3);

    expect(result).toHaveLength(2);
    expect(result).toEqual(mockTemplates);
  });

  it("should return empty array if no templates exist in DB", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    const result = await getRandomPublishedTemplates(3);

    expect(result).toEqual([]);
  });

  it("should handle database error gracefully and return empty array", async () => {
    mockFindMany.mockRejectedValueOnce(new Error("DB Connection Error"));

    const result = await getRandomPublishedTemplates(3);

    expect(result).toEqual([]);
  });
});
