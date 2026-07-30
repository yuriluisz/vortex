import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { prisma } from "../lib/prisma";

// Tipos esperados nos payloads dos jobs
interface LeadJobData {
  campaignId: string;
  tenantId: string;
  name: string | null;
  whatsapp: string;
  answers?: Record<string, string>;
  metadata: any;
  datadb: string;
  horadb: string;
}

interface ViewJobData {
  campaignId: string;
  tenantId: string;
}

console.log("🚀 Iniciando Workers do Vórtex+ (Alta Concorrência)...");

// ============================================================================
// WORKER: LEADS QUEUE
// ============================================================================
const leadsWorker = new Worker<LeadJobData>(
  "leads-queue",
  async (job: Job<LeadJobData>) => {
    const data = job.data;
    console.log(`[Worker - Leads] Processando lead para campanha ${data.campaignId}...`);

    try {
      await prisma.lead.create({
        data: {
          campaignId: data.campaignId,
          tenantId: data.tenantId,
          name: data.name,
          whatsapp: data.whatsapp,
          answers: data.answers,
          metadata: data.metadata,
          datadb: data.datadb,
          horadb: data.horadb,
        },
      });
      console.log(`[Worker - Leads] ✅ Lead salvo com sucesso no banco!`);
    } catch (error) {
      console.error(`[Worker - Leads] ❌ Erro ao salvar lead no banco:`, error);
      throw error; // Lança o erro para o BullMQ tentar novamente (backoff/retry)
    }
  },
  {
    connection: new Redis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null }),
    concurrency: 20, // Processa até 20 leads simultaneamente
  }
);

// ============================================================================
// WORKER: VIEWS QUEUE
// ============================================================================
const viewsWorker = new Worker<ViewJobData>(
  "views-queue",
  async (job: Job<ViewJobData>) => {
    const data = job.data;
    
    try {
      // Registrar a visualização individual
      await prisma.pageView.create({
        data: {
          campaignId: data.campaignId,
          tenantId: data.tenantId,
        },
      });

      // Incrementar o contador consolidado
      await prisma.campaign.update({
        where: { id: data.campaignId },
        data: { views: { increment: 1 } },
      });
    } catch (error) {
      console.error(`[Worker - Views] ❌ Erro ao registrar view:`, error);
      throw error;
    }
  },
  {
    connection: new Redis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null }),
    concurrency: 50, // Permite maior concorrência já que os inserts de pageview são simples
  }
);

// ============================================================================
// WORKER: GROUPS QUEUE (AUTO-CREATE)
// ============================================================================
interface AutoCreateGroupData {
  tenantId: string;
  campaignId: string;
  currentGroupName: string;
}

const groupsWorker = new Worker<AutoCreateGroupData>(
  "groups-queue",
  async (job: Job<AutoCreateGroupData>) => {
    const { tenantId, campaignId, currentGroupName } = job.data;
    console.log(`[Worker - Groups] Auto-criando próximo grupo após: ${currentGroupName}...`);
    
    // Lógica de auto-criação extraída
    const match = currentGroupName.match(/^(.+?)\s*(\d+)$/);
    const baseName = match ? match[1].trim() : currentGroupName;
    const currentNumber = match ? parseInt(match[2], 10) : 1;
    const nextNumber = currentNumber + 1;
    const nextName = `${baseName} ${String(nextNumber).padStart(2, "0")}`;

    const existing = await prisma.group.findFirst({
      where: { tenantId, campaignId, name: nextName },
    });

    if (existing) {
      console.log(`[Worker - Groups] Grupo ${nextName} já existe, abortando.`);
      return;
    }

    const previousGroup = await prisma.group.findFirst({
      where: { tenantId, campaignId, name: currentGroupName },
      select: { maxCapacity: true },
    });

    const evolutionInstance = await prisma.evolutionInstance.findUnique({
      where: { tenantId },
      select: { instanceName: true, status: true },
    });

    let groupJid: string | null = null;
    let inviteUrl = "";

    if (evolutionInstance?.status === "CONNECTED") {
      try {
        const { createEvolutionGroup, fetchInviteCode } = await import("../lib/evolution");
        const result = await createEvolutionGroup(evolutionInstance.instanceName, nextName);

        if (result) {
          groupJid = result.id;
          const code = await fetchInviteCode(evolutionInstance.instanceName, result.id);
          if (code) {
            inviteUrl = `https://chat.whatsapp.com/${code}`;
          }
        }
      } catch (error) {
        console.error("[Worker - Groups] Erro criando via Evolution API:", error);
      }
    }

    await prisma.group.create({
      data: {
        tenantId,
        campaignId,
        name: nextName,
        url: inviteUrl || "https://chat.whatsapp.com/PENDING",
        maxCapacity: previousGroup?.maxCapacity || 250,
        autoCreated: true,
        groupJid,
        inviteCode: inviteUrl ? inviteUrl.split("/").pop() || null : null,
      },
    });

    console.log(`[Worker - Groups] ✅ Grupo ${nextName} criado no banco com sucesso.`);
    
    // Import dinâmico por segurança
    const { logAudit } = await import("../lib/audit");
    await logAudit("GROUP_AUTO_CREATED", { campaignId, groupName: nextName, groupJid }, undefined, tenantId);
  },
  {
    connection: new Redis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null }),
    concurrency: 1, // Não queremos criar o mesmo grupo em paralelo
  }
);

// ============================================================================
// WORKER: WEBHOOKS QUEUE (EVOLUTION API)
// ============================================================================
const webhooksWorker = new Worker<any>(
  "webhooks-queue",
  async (job: Job<any>) => {
    const body = job.data;
    const event = body.event as string;

    console.log(`[Worker - Webhooks] Processando evento: ${event}`);

    if (event === "group-participants.update") {
      await processGroupParticipants(body);
    } else if (event === "connection.update") {
      await processConnectionUpdate(body);
    }
  },
  {
    connection: new Redis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null }),
    concurrency: 10, // Podemos processar vários webhooks simultaneamente
  }
);

// Lógica de processamento de participantes
async function processGroupParticipants(payload: any) {
  const { instance: instanceName, data } = payload;
  const { groupJid, action, participants } = data;

  if (!groupJid || !participants?.length) return;

  const evolutionInstance = await prisma.evolutionInstance.findFirst({
    where: { instanceName },
    select: { tenantId: true },
  });

  if (!evolutionInstance) return;
  const { tenantId } = evolutionInstance;

  const group = await prisma.group.findFirst({
    where: { groupJid, tenantId },
    select: { id: true, campaignId: true, currentCount: true, maxCapacity: true, name: true },
  });

  if (!group) return;

  if (action === "add") {
    // Importar a função de normalização
    const { normalizePhoneNumber } = await import("../lib/evolution");

    for (const participantJid of participants) {
      const phoneNumber = participantJid.split("@")[0];
      if (!phoneNumber) continue;

      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const lead = await prisma.lead.findFirst({
        where: {
          tenantId,
          campaignId: group.campaignId,
          status: "PENDING",
          OR: [
            { whatsapp: phoneNumber },
            { whatsapp: normalizedPhone },
            { whatsapp: { contains: phoneNumber.slice(-8) } },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      if (lead) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { status: "JOINED", joinedAt: new Date(), groupId: group.id },
        });
      }
    }
    
    // Atualizamos a contagem do banco de dados (o redis já foi incrementado pelo Rotacionador)
    // Opcionalmente podemos sincronizar o valor do banco se ele se perder, mas o Rotacionador 
    // lida primariamente com o Redis. Apenas incrementamos aqui como backup visual pro dashboard:
    await prisma.group.update({
      where: { id: group.id },
      data: { currentCount: { increment: participants.length } },
    });
    
  } else if (action === "remove") {
    const newCount = Math.max(0, group.currentCount - participants.length);
    await prisma.group.update({ where: { id: group.id }, data: { currentCount: newCount } });

    for (const participantJid of participants) {
      const phoneNumber = participantJid.split("@")[0];
      if (!phoneNumber) continue;

      await prisma.lead.updateMany({
        where: {
          tenantId, groupId: group.id, status: "JOINED",
          OR: [{ whatsapp: phoneNumber }, { whatsapp: { contains: phoneNumber.slice(-8) } }],
        },
        data: { status: "NOT_JOINED" },
      });
    }
  }
}

async function processConnectionUpdate(payload: any) {
  const { instance: instanceName, data } = payload;
  const { state } = data;

  if (!instanceName || !state) return;

  const statusMap: Record<string, string> = { open: "CONNECTED", close: "DISCONNECTED", connecting: "CONNECTING" };
  const newStatus = statusMap[state] || "DISCONNECTED";

  const instance = await prisma.evolutionInstance.findFirst({
    where: { instanceName },
    select: { id: true, tenantId: true, status: true },
  });

  if (!instance) return;

  if (instance.status !== newStatus) {
    await prisma.evolutionInstance.update({
      where: { id: instance.id },
      data: { status: newStatus },
    });

    const { logAudit } = await import("../lib/audit");
    const auditAction = newStatus === "CONNECTED" ? "WHATSAPP_CONNECTED" : "WHATSAPP_DISCONNECTED";
    await logAudit(auditAction, { instanceName, state: newStatus }, undefined, instance.tenantId);
  }
}

leadsWorker.on("failed", (job, err) => console.error(`[BullMQ] Leads job falhou: ${err.message}`));
viewsWorker.on("failed", (job, err) => console.error(`[BullMQ] Views job falhou: ${err.message}`));
groupsWorker.on("failed", (job, err) => console.error(`[BullMQ] Groups job falhou: ${err.message}`));
webhooksWorker.on("failed", (job, err) => console.error(`[BullMQ] Webhooks job falhou: ${err.message}`));

console.log("✅ Workers escutando filas: leads, views, groups, webhooks...");

