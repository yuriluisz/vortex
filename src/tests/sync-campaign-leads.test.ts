import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncCampaignLeadsAction } from "../app/admin/campaigns/[id]/leads/actions";
import { prisma } from "../lib/prisma";
import * as evolution from "../lib/evolution";

vi.mock("server-only", () => ({}));
vi.mock("../lib/prisma", () => ({
  prisma: {
    evolutionInstance: {
      findUnique: vi.fn(),
    },
    group: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    lead: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("../lib/evolution", async () => {
  const actual = await vi.importActual<any>("../lib/evolution");
  return {
    ...actual,
    fetchGroupParticipants: vi.fn(),
    fetchGroupByInviteCode: vi.fn(),
  };
});

describe("syncCampaignLeadsAction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should fail if instance is not connected", async () => {
    (prisma.evolutionInstance.findUnique as any).mockResolvedValueOnce(null);

    const result = await syncCampaignLeadsAction("camp-1", "tenant-1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("WhatsApp não está conectado");
  });

  it("should match lead with mask when WhatsApp returns clean JID", async () => {
    (prisma.evolutionInstance.findUnique as any).mockResolvedValueOnce({
      instanceName: "tenant-slug",
      status: "CONNECTED",
    });

    (prisma.group.findMany as any).mockResolvedValueOnce([
      {
        id: "group-1",
        name: "Grupo 1",
        groupJid: "123456@g.us",
        url: "https://chat.whatsapp.com/ABC",
      },
    ]);

    // Evolution API returns pure digits JID
    (evolution.fetchGroupParticipants as any).mockResolvedValueOnce([
      { id: "5511987654321@s.whatsapp.net" },
    ]);

    // Prisma lead in DB has mask "(11) 98765-4321"
    (prisma.lead.findMany as any).mockResolvedValueOnce([
      {
        id: "lead-1",
        whatsapp: "(11) 98765-4321",
        status: "PENDING",
      },
    ]);

    (prisma.lead.update as any).mockResolvedValue({});
    (prisma.group.update as any).mockResolvedValue({});
    (prisma.lead.updateMany as any).mockResolvedValue({ count: 0 });

    const result = await syncCampaignLeadsAction("camp-1", "tenant-1");

    expect(result.success).toBe(true);
    expect(result.totalSynced).toBe(1);

    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: "lead-1" },
      data: expect.objectContaining({
        status: "JOINED",
        groupId: "group-1",
      }),
    });
  });

  it("should match lead when WhatsApp has 8 digits and lead entered 9 digits", async () => {
    (prisma.evolutionInstance.findUnique as any).mockResolvedValueOnce({
      instanceName: "tenant-slug",
      status: "CONNECTED",
    });

    (prisma.group.findMany as any).mockResolvedValueOnce([
      {
        id: "group-1",
        name: "Grupo 1",
        groupJid: "123456@g.us",
        url: "https://chat.whatsapp.com/ABC",
      },
    ]);

    // Evolution API returns 8 digits JID (old WhatsApp account format)
    (evolution.fetchGroupParticipants as any).mockResolvedValueOnce([
      { id: "551187654321@s.whatsapp.net" },
    ]);

    // Prisma lead in DB has 9 digits: "+55 (11) 98765-4321"
    (prisma.lead.findMany as any).mockResolvedValueOnce([
      {
        id: "lead-2",
        whatsapp: "+55 (11) 98765-4321",
        status: "PENDING",
      },
    ]);

    (prisma.lead.update as any).mockResolvedValue({});
    (prisma.group.update as any).mockResolvedValue({});
    (prisma.lead.updateMany as any).mockResolvedValue({ count: 0 });

    const result = await syncCampaignLeadsAction("camp-1", "tenant-1");

    expect(result.success).toBe(true);
    expect(result.totalSynced).toBe(1);

    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: "lead-2" },
      data: expect.objectContaining({
        status: "JOINED",
        groupId: "group-1",
      }),
    });
  });

  it("should automatically resolve groupJid if missing from group.url", async () => {
    (prisma.evolutionInstance.findUnique as any).mockResolvedValueOnce({
      instanceName: "tenant-slug",
      status: "CONNECTED",
    });

    (prisma.group.findMany as any).mockResolvedValueOnce([
      {
        id: "group-no-jid",
        name: "Grupo Sem JID",
        groupJid: null,
        url: "https://chat.whatsapp.com/INVITE123",
      },
    ]);

    (evolution.fetchGroupByInviteCode as any).mockResolvedValueOnce({
      id: "resolved-jid@g.us",
    });

    (evolution.fetchGroupParticipants as any).mockResolvedValueOnce([
      { id: "5511999998888@s.whatsapp.net" },
    ]);

    (prisma.lead.findMany as any).mockResolvedValueOnce([
      {
        id: "lead-3",
        whatsapp: "11999998888",
        status: "NOT_JOINED", // was marked NOT_JOINED earlier
      },
    ]);

    (prisma.group.update as any).mockResolvedValue({});
    (prisma.lead.update as any).mockResolvedValue({});
    (prisma.lead.updateMany as any).mockResolvedValue({ count: 0 });

    const result = await syncCampaignLeadsAction("camp-1", "tenant-1");

    expect(result.success).toBe(true);
    expect(result.totalSynced).toBe(1);

    // Group was updated with resolved JID
    expect(prisma.group.update).toHaveBeenCalledWith({
      where: { id: "group-no-jid" },
      data: { groupJid: "resolved-jid@g.us", inviteCode: "INVITE123" },
    });
  });
});
