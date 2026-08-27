import { describe, it, expect, vi, beforeEach } from "vitest";
import { getActiveGroupForCampaign } from "../lib/rotator";
import { redis } from "../lib/redis";
import { prisma } from "../lib/prisma";

vi.mock("server-only", () => ({}));

// Mock do Redis e Prisma
const { mockRedisInstance } = vi.hoisted(() => {
  const mock = {
    get: vi.fn(),
    set: vi.fn(),
    incrementIfNotFull: vi.fn(),
    defineCommand: vi.fn(),
  };
  return { mockRedisInstance: mock };
});

vi.mock("../lib/redis", () => ({
  redis: mockRedisInstance,
  createRedisConnection: vi.fn(() => mockRedisInstance),
  defaultRedisOptions: {},
  getRedisUrl: vi.fn(() => "redis://localhost:6379"),
}));

vi.mock("../lib/prisma", () => ({
  prisma: {
    group: {
      findMany: vi.fn(),
      update: vi.fn(() => Promise.resolve({})),
    },
  },
}));

describe("Rotator Logic (getActiveGroupForCampaign)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return null if there are no active groups", async () => {
    (redis.get as any).mockResolvedValueOnce(null);
    (prisma.group.findMany as any).mockResolvedValueOnce([]);

    const result = await getActiveGroupForCampaign("campaign-1");

    expect(result).toBeNull();
    expect(prisma.group.findMany).toHaveBeenCalledTimes(1);
  });

  it("should return the first group if it has capacity", async () => {
    const mockGroups = [
      { id: "g1", url: "https://chat.whatsapp.com/1", currentCount: 100, maxCapacity: 250, tenantId: "t1", name: "Group 1" },
    ];

    (redis.get as any).mockResolvedValueOnce(JSON.stringify(mockGroups));
    // Simulate Lua script returning the new count (not -1)
    (redis.incrementIfNotFull as any).mockResolvedValueOnce(101);

    const result = await getActiveGroupForCampaign("campaign-1");

    expect(result).toEqual({ url: "https://chat.whatsapp.com/1" });
    expect(redis.incrementIfNotFull).toHaveBeenCalledWith(
      "group:count:g1",
      250,
      100
    );
  });

  it("should rollover to the second group if the first is full", async () => {
    const mockGroups = [
      { id: "g1", url: "https://chat.whatsapp.com/1", currentCount: 250, maxCapacity: 250, tenantId: "t1", name: "Group 1" },
      { id: "g2", url: "https://chat.whatsapp.com/2", currentCount: 0, maxCapacity: 250, tenantId: "t1", name: "Group 2" },
    ];

    (redis.get as any).mockResolvedValueOnce(JSON.stringify(mockGroups));
    
    // Simular que g1 está cheio (script retorna -1)
    (redis.incrementIfNotFull as any).mockResolvedValueOnce(-1);
    
    // Simular que g2 tem vaga
    (redis.incrementIfNotFull as any).mockResolvedValueOnce(1);

    const result = await getActiveGroupForCampaign("campaign-1");

    expect(result).toEqual({ url: "https://chat.whatsapp.com/2" });
    expect(redis.incrementIfNotFull).toHaveBeenCalledTimes(2);
  });

  it("should return null if all groups are full", async () => {
    const mockGroups = [
      { id: "g1", url: "https://chat.whatsapp.com/1", currentCount: 250, maxCapacity: 250, tenantId: "t1", name: "Group 1" },
    ];

    (redis.get as any).mockResolvedValueOnce(JSON.stringify(mockGroups));
    
    // Todos retornam -1 (cheio)
    (redis.incrementIfNotFull as any).mockResolvedValueOnce(-1);

    const result = await getActiveGroupForCampaign("campaign-1");

    expect(result).toBeNull();
  });
});
