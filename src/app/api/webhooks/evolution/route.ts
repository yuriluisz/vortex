import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePhoneNumber } from "@/lib/evolution";
import { logAudit } from "@/lib/audit";

// ============================================================================
// WEBHOOK HANDLER — Evolution API
// ============================================================================

/**
 * POST /api/webhooks/evolution
 *
 * Recebe eventos da Evolution API:
 * - GROUP_PARTICIPANTS_UPDATE: Participante entrou/saiu do grupo
 * - CONNECTION_UPDATE: Status de conexão mudou
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = body.event as string;

    if (!event) {
      return NextResponse.json({ error: "Missing event" }, { status: 400 });
    }

    switch (event) {
      case "group-participants.update":
        await handleGroupParticipantsUpdate(body);
        break;

      case "connection.update":
        await handleConnectionUpdate(body);
        break;

      default:
        // Evento não tratado — OK, apenas ignorar
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook Evolution] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// ============================================================================
// GROUP_PARTICIPANTS_UPDATE
// ============================================================================

interface GroupParticipantsPayload {
  instance: string;
  data: {
    groupJid: string;
    action: "add" | "remove" | "promote" | "demote";
    participants: string[]; // ["5511999999999@s.whatsapp.net"]
  };
}

async function handleGroupParticipantsUpdate(
  payload: GroupParticipantsPayload
) {
  const { instance: instanceName, data } = payload;
  const { groupJid, action, participants } = data;

  if (!groupJid || !participants?.length) return;

  // Buscar a instância para obter o tenantId
  const evolutionInstance = await prisma.evolutionInstance.findFirst({
    where: { instanceName },
    select: { tenantId: true },
  });

  if (!evolutionInstance) {
    console.warn(
      `[Webhook] Instance "${instanceName}" not found in database`
    );
    return;
  }

  const { tenantId } = evolutionInstance;

  // Buscar o grupo pelo JID
  const group = await prisma.group.findFirst({
    where: { groupJid, tenantId },
    select: {
      id: true,
      campaignId: true,
      currentCount: true,
      maxCapacity: true,
      name: true,
    },
  });

  if (!group) {
    // Grupo não mapeado no sistema — ignorar
    return;
  }

  if (action === "add") {
    await handleParticipantAdd(tenantId, group, participants);
  } else if (action === "remove") {
    await handleParticipantRemove(tenantId, group, participants);
  }
}

// ---------------------------------------------------------------------------
// ADD — Participante entrou no grupo
// ---------------------------------------------------------------------------

async function handleParticipantAdd(
  tenantId: string,
  group: {
    id: string;
    campaignId: string;
    currentCount: number;
    maxCapacity: number;
    name: string;
  },
  participants: string[]
) {
  for (const participantJid of participants) {
    // Extrair número do JID: "5511999999999@s.whatsapp.net" → "5511999999999"
    const phoneNumber = participantJid.split("@")[0];
    if (!phoneNumber) continue;

    // Tentar encontrar um lead PENDING com esse número
    // Normaliza para buscar variações (com/sem 55, com/sem 9)
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    const lead = await prisma.lead.findFirst({
      where: {
        tenantId,
        campaignId: group.campaignId,
        status: "PENDING",
        OR: [
          { whatsapp: phoneNumber },
          { whatsapp: normalizedPhone },
          { whatsapp: { contains: phoneNumber.slice(-8) } }, // últimos 8 dígitos
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    if (lead) {
      // Atualizar lead para JOINED
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          status: "JOINED",
          joinedAt: new Date(),
          groupId: group.id,
        },
      });
    }
  }

  // Atualizar currentCount do grupo com contagem real (participantes adicionados)
  await prisma.group.update({
    where: { id: group.id },
    data: {
      currentCount: { increment: participants.length },
    },
  });

  // Verificar se grupo lotou → auto-criação será tratada pelo rotator
  const updatedGroup = await prisma.group.findUnique({
    where: { id: group.id },
    select: { currentCount: true, maxCapacity: true },
  });

  if (
    updatedGroup &&
    updatedGroup.currentCount >= updatedGroup.maxCapacity
  ) {
    // Disparar auto-criação do próximo grupo
    await autoCreateNextGroup(tenantId, group.campaignId, group.name);
  }
}

// ---------------------------------------------------------------------------
// REMOVE — Participante saiu do grupo
// ---------------------------------------------------------------------------

async function handleParticipantRemove(
  tenantId: string,
  group: {
    id: string;
    campaignId: string;
    currentCount: number;
  },
  participants: string[]
) {
  // Decrementar contagem (nunca abaixo de 0)
  const newCount = Math.max(0, group.currentCount - participants.length);

  await prisma.group.update({
    where: { id: group.id },
    data: { currentCount: newCount },
  });

  // Marcar leads como NOT_JOINED se saíram
  for (const participantJid of participants) {
    const phoneNumber = participantJid.split("@")[0];
    if (!phoneNumber) continue;

    await prisma.lead.updateMany({
      where: {
        tenantId,
        groupId: group.id,
        status: "JOINED",
        OR: [
          { whatsapp: phoneNumber },
          { whatsapp: { contains: phoneNumber.slice(-8) } },
        ],
      },
      data: { status: "NOT_JOINED" },
    });
  }
}

// ============================================================================
// CONNECTION_UPDATE
// ============================================================================

interface ConnectionUpdatePayload {
  instance: string;
  data: {
    state: string; // "open" | "close" | "connecting"
  };
}

async function handleConnectionUpdate(
  payload: ConnectionUpdatePayload
) {
  const { instance: instanceName, data } = payload;
  const { state } = data;

  if (!instanceName || !state) return;

  const statusMap: Record<string, string> = {
    open: "CONNECTED",
    close: "DISCONNECTED",
    connecting: "CONNECTING",
  };

  const newStatus = statusMap[state] || "DISCONNECTED";

  const instance = await prisma.evolutionInstance.findFirst({
    where: { instanceName },
    select: { id: true, tenantId: true, status: true },
  });

  if (!instance) return;

  // Só atualizar se realmente mudou
  if (instance.status !== newStatus) {
    await prisma.evolutionInstance.update({
      where: { id: instance.id },
      data: { status: newStatus },
    });

    const auditAction =
      newStatus === "CONNECTED"
        ? "WHATSAPP_CONNECTED"
        : "WHATSAPP_DISCONNECTED";

    await logAudit(
      auditAction as "WHATSAPP_CONNECTED" | "WHATSAPP_DISCONNECTED",
      { instanceName, state: newStatus },
      undefined,
      instance.tenantId
    );
  }
}

// ============================================================================
// AUTO-CREATE NEXT GROUP
// ============================================================================

/**
 * Cria automaticamente o próximo grupo quando o atual lota.
 * Ex: "VIP 01" lotou → cria "VIP 02".
 */
async function autoCreateNextGroup(
  tenantId: string,
  campaignId: string,
  currentGroupName: string
) {
  // Extrair nome base e número
  const match = currentGroupName.match(/^(.+?)\s*(\d+)$/);
  const baseName = match ? match[1].trim() : currentGroupName;
  const currentNumber = match ? parseInt(match[2], 10) : 1;
  const nextNumber = currentNumber + 1;
  const nextName = `${baseName} ${String(nextNumber).padStart(2, "0")}`;

  // Verificar se já existe um grupo com esse nome
  const existing = await prisma.group.findFirst({
    where: { tenantId, campaignId, name: nextName },
  });

  if (existing) return; // Já existe, não criar duplicata

  // Buscar capacidade padrão do grupo anterior
  const previousGroup = await prisma.group.findFirst({
    where: { tenantId, campaignId, name: currentGroupName },
    select: { maxCapacity: true },
  });

  // Tentar criar o grupo via Evolution API se conectado
  const evolutionInstance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
    select: { instanceName: true, status: true },
  });

  let groupJid: string | null = null;
  let inviteUrl = "";

  if (evolutionInstance?.status === "CONNECTED") {
    try {
      // Importar dinamicamente para evitar circular dependency
      const { createEvolutionGroup, fetchInviteCode } = await import(
        "@/lib/evolution"
      );

      const result = await createEvolutionGroup(
        evolutionInstance.instanceName,
        nextName
      );

      if (result) {
        groupJid = result.id;

        // Buscar invite code do grupo criado
        const code = await fetchInviteCode(
          evolutionInstance.instanceName,
          result.id
        );
        if (code) {
          inviteUrl = `https://chat.whatsapp.com/${code}`;
        }
      }
    } catch (error) {
      console.error("[Auto-Create] Error creating group via Evolution:", error);
    }
  }

  // Criar grupo no banco
  await prisma.group.create({
    data: {
      tenantId,
      campaignId,
      name: nextName,
      url: inviteUrl || "https://chat.whatsapp.com/PENDING",
      maxCapacity: previousGroup?.maxCapacity || 250,
      autoCreated: true,
      groupJid,
      inviteCode: inviteUrl
        ? inviteUrl.split("/").pop() || null
        : null,
    },
  });

  await logAudit(
    "GROUP_AUTO_CREATED",
    { campaignId, groupName: nextName, groupJid },
    undefined,
    tenantId
  );
}
