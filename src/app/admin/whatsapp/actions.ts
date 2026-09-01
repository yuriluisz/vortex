"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/audit";
import { hasFeature, canCreateResource } from "@/lib/plans";
import type { Plan } from "@/lib/prisma-types";
import {
  createInstance,
  getQRCode,
  getConnectionState,
  deleteInstance,
  setWebhook,
  sendTextMessage,
  createEvolutionGroup,
  fetchInviteCode,
  updateGroupSetting,
  updateGroupDescription,
  updateGroupPicture,
} from "@/lib/evolution";
import { syncGroupParticipants, resolveGroupJids } from "@/lib/evolution-sync";
import { requireTenantOwnership } from "@/lib/tenant-guard";

// ============================================================================
// AUTH + ULTRA GUARD
// ============================================================================

async function requireUltra() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    throw new Error("Não autorizado.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { id: true, slug: true, plan: true },
  });

  if (!tenant) {
    throw new Error("Tenant não encontrado.");
  }

  if (!hasFeature(tenant.plan as Plan, "whatsappIntegration")) {
    throw new Error(
      "Integração WhatsApp disponível apenas no plano Ultra."
    );
  }

  return {
    userId: session.userId,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    plan: tenant.plan as Plan,
  };
}

// ============================================================================
// CONFIG — STEP 1: Salvar número de telefone e criar instância
// ============================================================================

const PhoneSchema = z.object({
  phoneNumber: z
    .string()
    .min(10, "Número de telefone inválido")
    .max(15, "Número de telefone inválido"),
});

export type WhatsAppConfigState = {
  success?: boolean;
  error?: string;
  step?: "phone" | "qrcode" | "connected";
  qrCode?: string;
  pairingCode?: string;
} | undefined;

export async function setupWhatsAppAction(
  state: WhatsAppConfigState,
  formData: FormData
): Promise<WhatsAppConfigState> {
  const { tenantId, tenantSlug } = await requireUltra();

  const parsed = PhoneSchema.safeParse({
    phoneNumber: formData.get("phoneNumber"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Número inválido.",
      step: "phone",
    };
  }

  const { phoneNumber } = parsed.data;

  // Limpar número (só dígitos)
  const cleanNumber = phoneNumber.replace(/\D/g, "");

  try {
    // Verificar se já existe instância
    const existing = await prisma.evolutionInstance.findUnique({
      where: { tenantId },
    });

    const instanceName = tenantSlug;

    if (existing) {
      // Deletar instância antiga na Evolution API
      try {
        await deleteInstance(existing.instanceName);
      } catch {
        // Instância pode já não existir na Evolution
      }

      // Atualizar no banco
      await prisma.evolutionInstance.update({
        where: { tenantId },
        data: {
          instanceName,
          phoneNumber: cleanNumber,
          status: "CONNECTING",
        },
      });
    } else {
      // Criar no banco
      await prisma.evolutionInstance.create({
        data: {
          tenantId,
          instanceName,
          phoneNumber: cleanNumber,
          status: "CONNECTING",
        },
      });
    }

    // Criar instância na Evolution API
    let result: any = {};
    try {
      result = await createInstance(instanceName, cleanNumber);
    } catch (e: any) {
      if (e.message.includes("403") || e.message.includes("already in use")) {
        console.log(`[WhatsApp Setup] Instância ${instanceName} já existe na Evolution. Prosseguindo...`);
      } else {
        throw e;
      }
    }

    // Configurar webhook
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await setWebhook(instanceName, `${appUrl}/api/webhooks/evolution`);

    // Se já retornou QR Code na criação
    if (result.qrcode?.base64) {
      return {
        success: true,
        step: "qrcode",
        qrCode: result.qrcode.base64,
      };
    }

    // Se não, buscar QR Code separadamente
    const qr = await getQRCode(instanceName);
    return {
      success: true,
      step: "qrcode",
      qrCode: qr.base64 || undefined,
      pairingCode: qr.pairingCode || undefined,
    };
  } catch (error) {
    console.error("[WhatsApp Setup] Error:", error);
    return {
      error: "Erro ao criar instância. Verifique suas credenciais Evolution API.",
      step: "phone",
    };
  }
}

// ============================================================================
// CONFIG — Buscar QR Code (para refresh)
// ============================================================================

export async function refreshQRCodeAction(): Promise<{
  qrCode?: string;
  pairingCode?: string;
  error?: string;
  connected?: boolean;
}> {
  const { tenantId } = await requireUltra();

  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
    select: { instanceName: true },
  });

  if (!instance) {
    return { error: "Instância não configurada." };
  }

  try {
    // Primeiro verificar se já conectou
    const state = await getConnectionState(instance.instanceName);
    if (state.instance.state === "open") {
      await prisma.evolutionInstance.update({
        where: { tenantId },
        data: { status: "CONNECTED" },
      });
      return { connected: true };
    }

    // Buscar novo QR Code
    const qr = await getQRCode(instance.instanceName);
    return {
      qrCode: qr.base64 || undefined,
      pairingCode: qr.pairingCode || undefined,
    };
  } catch (error) {
    console.error("[QR Refresh] Error:", error);
    return { error: "Erro ao gerar QR Code." };
  }
}

// ============================================================================
// CONFIG — Verificar status de conexão
// ============================================================================

export async function checkConnectionAction(): Promise<{
  connected: boolean;
  status: string;
}> {
  const { userId, tenantId } = await requireUltra();

  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
    select: { instanceName: true, status: true },
  });

  if (!instance) {
    return { connected: false, status: "NOT_CONFIGURED" };
  }

  try {
    const state = await getConnectionState(instance.instanceName);
    const stateMap: Record<string, string> = {
      open: "CONNECTED",
      close: "DISCONNECTED",
      connecting: "CONNECTING",
    };

    const newStatus = stateMap[state.instance.state] || "DISCONNECTED";

    if (newStatus !== instance.status) {
      await prisma.evolutionInstance.update({
        where: { tenantId },
        data: { status: newStatus },
      });

      if (newStatus === "CONNECTED") {
        await logAudit(
          "WHATSAPP_CONNECTED",
          { instanceName: instance.instanceName },
          userId,
          tenantId
        );

        // Resolver JIDs dos grupos existentes ao conectar
        await resolveGroupJids(tenantId);
      }
    }

    return {
      connected: newStatus === "CONNECTED",
      status: newStatus,
    };
  } catch {
    return { connected: false, status: "ERROR" };
  }
}

// ============================================================================
// CONFIG — Desconectar WhatsApp
// ============================================================================

export async function disconnectWhatsAppAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  const { userId, tenantId } = await requireUltra();

  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
    select: { id: true, instanceName: true },
  });

  if (!instance) {
    return { success: false, error: "Nenhuma instância configurada." };
  }

  try {
    await deleteInstance(instance.instanceName);
  } catch {
    // Instância pode não existir na Evolution
  }

  await prisma.evolutionInstance.delete({
    where: { id: instance.id },
  });

  await logAudit(
    "WHATSAPP_DISCONNECTED",
    { instanceName: instance.instanceName },
    userId,
    tenantId
  );

  revalidatePath("/admin/whatsapp");

  return { success: true };
}

// ============================================================================
// BROADCAST — Enviar mensagem para grupos
// ============================================================================

const BroadcastSchema = z.object({
  campaignId: z.string().uuid("Campanha inválida"),
  message: z.string().min(1, "A mensagem não pode estar vazia").max(4096, "Mensagem muito longa"),
  targetType: z.enum(["ALL", "SELECTED"]),
  groupIds: z.array(z.string().uuid()).optional(),
});

export type BroadcastState = {
  success?: boolean;
  error?: string;
  sentCount?: number;
  failedCount?: number;
} | undefined;

export async function sendBroadcastAction(
  state: BroadcastState,
  formData: FormData
): Promise<BroadcastState> {
  const { userId, tenantId } = await requireUltra();

  const targetType = formData.get("targetType") as string;
  const groupIdsRaw = formData.get("groupIds") as string;
  const groupIds = groupIdsRaw ? JSON.parse(groupIdsRaw) : [];

  const parsed = BroadcastSchema.safeParse({
    campaignId: formData.get("campaignId"),
    message: formData.get("message"),
    targetType,
    groupIds: targetType === "SELECTED" ? groupIds : undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Dados inválidos.",
    };
  }

  // Verificar conexão WhatsApp
  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
    select: { instanceName: true, status: true },
  });

  if (!instance || instance.status !== "CONNECTED") {
    return { error: "WhatsApp não está conectado." };
  }

  // Buscar grupos alvo
  const whereClause: Record<string, unknown> = {
    tenantId,
    campaignId: parsed.data.campaignId,
    active: true,
    groupJid: { not: null },
  };

  if (parsed.data.targetType === "SELECTED" && parsed.data.groupIds?.length) {
    whereClause.id = { in: parsed.data.groupIds };
  }

  const groups = await prisma.group.findMany({
    where: whereClause,
    select: { id: true, groupJid: true, name: true },
  });

  if (groups.length === 0) {
    return {
      error: "Nenhum grupo disponível com JID vinculado. Sincronize os grupos primeiro.",
    };
  }

  // Enviar mensagens
  const results: Record<string, string> = {};
  let sentCount = 0;
  let failedCount = 0;

  for (const group of groups) {
    if (!group.groupJid) continue;

    try {
      await sendTextMessage(
        instance.instanceName,
        group.groupJid,
        parsed.data.message
      );
      results[group.id] = "OK";
      sentCount++;
    } catch (error) {
      console.error(
        `[Broadcast] Failed to send to group ${group.name}:`,
        error
      );
      results[group.id] = "FAILED";
      failedCount++;
    }
  }

  // Salvar no histórico
  const overallStatus =
    failedCount === 0
      ? "SENT"
      : sentCount === 0
        ? "FAILED"
        : "PARTIAL";

  await prisma.groupMessage.create({
    data: {
      tenantId,
      campaignId: parsed.data.campaignId,
      content: parsed.data.message,
      targetType: parsed.data.targetType,
      groupIds: groups.map((g) => g.id),
      sentBy: userId,
      status: overallStatus,
      results,
    },
  });

  await logAudit(
    "GROUP_MESSAGE_SENT",
    {
      campaignId: parsed.data.campaignId,
      targetType: parsed.data.targetType,
      sentCount,
      failedCount,
    },
    userId,
    tenantId
  );

  revalidatePath("/admin/whatsapp/broadcast");

  return {
    success: true,
    sentCount,
    failedCount,
  };
}

export async function retryFailedBroadcastAction(
  messageId: string
): Promise<{ success: boolean; sentCount?: number; failedCount?: number; error?: string }> {
  const { userId, tenantId } = await requireUltra();

  const message = await prisma.groupMessage.findUnique({
    where: { id: messageId },
  });

  if (!message || message.tenantId !== tenantId) {
    return { success: false, error: "Mensagem não encontrada." };
  }

  const resultsObj = (message.results as Record<string, string>) || {};
  const failedGroupIds = Object.keys(resultsObj).filter((gid) => resultsObj[gid] === "FAILED");

  if (failedGroupIds.length === 0) {
    return { success: false, error: "Não há grupos pendentes ou com falha para reenvio." };
  }

  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
    select: { instanceName: true, status: true },
  });

  if (!instance || instance.status !== "CONNECTED") {
    return { success: false, error: "WhatsApp não está conectado." };
  }

  const groups = await prisma.group.findMany({
    where: {
      id: { in: failedGroupIds },
      tenantId,
      active: true,
      groupJid: { not: null },
    },
    select: { id: true, groupJid: true, name: true },
  });

  let sentCount = 0;
  let failedCount = 0;
  const updatedResults = { ...resultsObj };

  for (const group of groups) {
    if (!group.groupJid) continue;
    try {
      await sendTextMessage(instance.instanceName, group.groupJid, message.content);
      updatedResults[group.id] = "OK";
      sentCount++;
    } catch {
      updatedResults[group.id] = "FAILED";
      failedCount++;
    }
  }

  const overallFailed = Object.values(updatedResults).filter((v) => v === "FAILED").length;
  const overallSent = Object.values(updatedResults).filter((v) => v === "OK").length;
  const newStatus = overallFailed === 0 ? "SENT" : overallSent === 0 ? "FAILED" : "PARTIAL";

  await prisma.groupMessage.update({
    where: { id: messageId },
    data: {
      status: newStatus,
      results: updatedResults,
    },
  });

  await logAudit(
    "GROUP_MESSAGE_SENT",
    { messageId, sentCount, failedCount, isRetry: true },
    userId,
    tenantId
  );

  revalidatePath("/admin/whatsapp/broadcast");
  return { success: true, sentCount, failedCount };
}

// ============================================================================
// SYNC — Sincronizar grupo individual
// ============================================================================

export async function syncGroupAction(
  groupId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  const { tenantId } = await requireUltra();

  // 🔒 IDOR Prevention: Validar que o grupo pertence ao tenant autenticado
  const ownership = await requireTenantOwnership(prisma.group, groupId, tenantId, "Grupo");
  if (ownership.error) {
    return { success: false, error: ownership.error.error };
  }

  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
    select: { instanceName: true, status: true },
  });

  if (!instance || instance.status !== "CONNECTED") {
    return { success: false, error: "WhatsApp não está conectado." };
  }

  const result = await syncGroupParticipants(
    groupId,
    instance.instanceName
  );

  if (result.success) {
    await logAudit(
      "GROUP_SYNCED",
      { groupId, participantCount: result.count },
      undefined,
      tenantId
    );
  }

  revalidatePath("/admin/campaigns");

  return result;
}

// ============================================================================
// BULK CREATE — Criação em massa de grupos
// ============================================================================

const BulkCreateSchema = z.object({
  campaignId: z.string().uuid(),
  baseName: z.string().min(1, "O nome base é obrigatório"),
  quantity: z.coerce.number().min(1).max(20, "Máximo de 20 grupos por vez"),
  maxCapacity: z.coerce.number().min(1).max(1024),
  participantNumber: z.string().min(10, "O número auxiliar é obrigatório").optional(),
  description: z.string().optional(),
});

export type BulkCreateState = {
  success?: boolean;
  error?: string;
  createdCount?: number;
} | undefined;

export async function bulkCreateGroupsAction(
  state: BulkCreateState,
  formData: FormData
): Promise<BulkCreateState> {
  const { userId, tenantId, plan } = await requireUltra();

  const parsed = BulkCreateSchema.safeParse({
    campaignId: formData.get("campaignId"),
    baseName: formData.get("baseName"),
    quantity: formData.get("quantity"),
    maxCapacity: formData.get("maxCapacity"),
    participantNumber: formData.get("participantNumber"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Dados inválidos.",
    };
  }

  const { campaignId, baseName, quantity, maxCapacity, participantNumber, description } = parsed.data;
  const cleanNumber = participantNumber ? participantNumber.replace(/\D/g, "") : "";

  let base64Image: string | undefined = undefined;
  const pictureFile = formData.get("picture") as File | null;
  if (pictureFile && pictureFile.size > 0) {
    const arrayBuffer = await pictureFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    base64Image = buffer.toString("base64");
  }

  // Verificar se a campanha pertence ao tenant
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { tenantId: true },
  });

  if (!campaign || campaign.tenantId !== tenantId) {
    return { error: "Campanha não encontrada." };
  }

  // Verificar limite do plano para a criação em lote
  const currentCount = await prisma.group.count({ where: { tenantId } });
  const limitCheck = canCreateResource(plan, "groups", currentCount + quantity - 1);
  if (!limitCheck.allowed) {
    return { error: limitCheck.reason };
  }

  // Buscar instância para criar no WhatsApp se possível
  const instance = await prisma.evolutionInstance.findUnique({
    where: { tenantId },
    select: { instanceName: true, status: true },
  });

  const isConnected = instance?.status === "CONNECTED";

  // Verificar qual o próximo número disponível
  const existingGroups = await prisma.group.count({
    where: { tenantId, campaignId, name: { startsWith: baseName } },
  });

  let createdCount = 0;

  for (let i = 0; i < quantity; i++) {
    const number = existingGroups + i + 1;
    const groupName = `${baseName} ${String(number).padStart(2, "0")}`;

    let groupJid: string | null = null;
    let inviteUrl = "";
    let inviteCode: string | null = null;

    // Tentar criar no WhatsApp via Evolution
    if (isConnected && instance) {
      try {
        const result = await createEvolutionGroup(
          instance.instanceName,
          groupName,
          cleanNumber ? [cleanNumber] : []
        );

        if (result) {
          groupJid = result.id;
          
          // Travar configurações do grupo recém-criado (anúncios apenas, info fechada)
          await updateGroupSetting(instance.instanceName, groupJid, "announcement");
          await updateGroupSetting(instance.instanceName, groupJid, "locked");

          if (description) {
            await updateGroupDescription(instance.instanceName, groupJid, description);
          }
          
          if (base64Image) {
            await updateGroupPicture(instance.instanceName, groupJid, base64Image);
          }

          const code = await fetchInviteCode(
            instance.instanceName,
            result.id
          );
          if (code) {
            inviteUrl = `https://chat.whatsapp.com/${code}`;
            inviteCode = code;
          }
        }
      } catch (error) {
        console.error(
          `[Bulk Create] Error creating group "${groupName}":`,
          error
        );
      }
    }

    await prisma.group.create({
      data: {
        tenantId,
        campaignId,
        name: groupName,
        url: inviteUrl || "https://chat.whatsapp.com/PENDING",
        maxCapacity,
        autoCreated: false,
        groupJid,
        inviteCode,
      },
    });

    createdCount++;
  }

  await logAudit(
    "GROUP_BULK_CREATED",
    { campaignId, baseName, quantity: createdCount },
    userId,
    tenantId
  );

  revalidatePath(`/admin/campaigns/${campaignId}`);

  return {
    success: true,
    createdCount,
  };
}
