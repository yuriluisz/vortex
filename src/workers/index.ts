import { Worker, Job } from "bullmq";
import { prisma } from "../lib/prisma";
import { createRedisConnection } from "../lib/redis";
import { isSafePublicUrl } from "../lib/ssrf-guard";
import type { Prisma } from "@prisma/client";

// Tipos esperados nos payloads dos jobs
interface LeadJobData {
  campaignId: string;
  tenantId: string;
  name: string | null;
  whatsapp: string;
  answers?: Record<string, string>;
  metadata?: Prisma.InputJsonValue;
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
    connection: createRedisConnection({ lazyConnect: false }),
    concurrency: 20,
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
    connection: createRedisConnection({ lazyConnect: false }),
    concurrency: 50,
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
    
    // Buscar configurações da campanha
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { 
        groupMaxCapacity: true, 
        groupSupportPhones: true, 
        groupDescription: true, 
        groupImageUrl: true 
      }
    });

    if (!campaign) return;

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

    const evolutionInstance = await prisma.evolutionInstance.findUnique({
      where: { tenantId },
      select: { instanceName: true, status: true },
    });

    let groupJid: string | null = null;
    let inviteUrl = "";

    if (evolutionInstance?.status === "CONNECTED") {
      try {
        const { 
          createEvolutionGroup, 
          fetchInviteCode, 
          updateGroupParticipant, 
          updateGroupDescription, 
          updateGroupPicture 
        } = await import("../lib/evolution");
        
        // Preparar array de participantes (Suporte) -> ex: 5511999999999@s.whatsapp.net
        const supportJids = campaign.groupSupportPhones.map(phone => `${phone}@s.whatsapp.net`);

        // 1. Cria o grupo já inserindo os membros de apoio
        const result = await createEvolutionGroup(evolutionInstance.instanceName, nextName, supportJids);

        if (result) {
          groupJid = result.id;
          
          // 2. Busca o link de convite
          const code = await fetchInviteCode(evolutionInstance.instanceName, result.id);
          if (code) {
            inviteUrl = `https://chat.whatsapp.com/${code}`;
          }

          // 3. Promove os membros de apoio a Administradores
          if (supportJids.length > 0) {
            await updateGroupParticipant(evolutionInstance.instanceName, result.id, "promote", supportJids);
          }

          // 4. Atualiza a Descrição
          if (campaign.groupDescription) {
            await updateGroupDescription(evolutionInstance.instanceName, result.id, campaign.groupDescription);
          }

          // 5. Atualiza a Imagem do Grupo (Baixa da URL com proteção contra SSRF e converte para Base64)
          if (campaign.groupImageUrl) {
            try {
              const isSafe = await isSafePublicUrl(campaign.groupImageUrl);
              if (!isSafe) {
                console.warn(`[Worker - Groups] URL insegura bloqueada pelo SSRF guard: ${campaign.groupImageUrl}`);
              } else {
                const imgRes = await fetch(campaign.groupImageUrl, {
                  signal: AbortSignal.timeout(5000),
                });

                const contentLength = Number(imgRes.headers.get("content-length") || 0);
                if (contentLength > 5 * 1024 * 1024) {
                  console.warn(`[Worker - Groups] Imagem do grupo excede limite de 5MB: ${contentLength} bytes`);
                } else if (imgRes.ok) {
                  const arrayBuffer = await imgRes.arrayBuffer();
                  if (arrayBuffer.byteLength <= 5 * 1024 * 1024) {
                    const base64Image = Buffer.from(arrayBuffer).toString("base64");
                    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
                    await updateGroupPicture(
                      evolutionInstance.instanceName,
                      result.id,
                      `data:${contentType};base64,${base64Image}`
                    );
                  }
                }
              }
            } catch (err) {
              console.error(`[Worker - Groups] Erro ao baixar/setar imagem do grupo:`, err);
            }
          }
        }
      } catch (error) {
        console.error("[Worker - Groups] Erro configurando grupo via Evolution API:", error);
      }
    }

    await prisma.group.create({
      data: {
        tenantId,
        campaignId,
        name: nextName,
        url: inviteUrl || "https://chat.whatsapp.com/PENDING",
        maxCapacity: campaign.groupMaxCapacity,
        autoCreated: true,
        groupJid,
        inviteCode: inviteUrl ? inviteUrl.split("/").pop() || null : null,
      },
    });

    console.log(`[Worker - Groups] ✅ Grupo ${nextName} criado e configurado com sucesso.`);
    
    const { logAudit } = await import("../lib/audit");
    await logAudit("GROUP_AUTO_CREATED", { campaignId, groupName: nextName, groupJid }, undefined, tenantId);
  },
  {
    connection: createRedisConnection({ lazyConnect: false }),
    concurrency: 1, // Não queremos criar o mesmo grupo em paralelo
  }
);

// ============================================================================
// WORKER: WEBHOOKS QUEUE (EVOLUTION API)
// ============================================================================
interface EvolutionGroupParticipantPayload {
  event: "group-participants.update";
  instance: string;
  data: {
    groupJid: string;
    action: "add" | "remove" | string;
    participants: (string | { id?: string })[];
  };
}

interface EvolutionConnectionPayload {
  event: "connection.update";
  instance: string;
  data: {
    state: string;
  };
}

type EvolutionWebhookJobData = EvolutionGroupParticipantPayload | EvolutionConnectionPayload;

const webhooksWorker = new Worker<EvolutionWebhookJobData>(
  "webhooks-queue",
  async (job: Job<EvolutionWebhookJobData>) => {
    const body = job.data;
    const event = body.event;

    console.log(`[Worker - Webhooks] Processando evento: ${event}`);

    if (event === "group-participants.update" && "participants" in body.data) {
      await processGroupParticipants(body as EvolutionGroupParticipantPayload);
    } else if (event === "connection.update" && "state" in body.data) {
      await processConnectionUpdate(body as EvolutionConnectionPayload);
    }
  },
  {
    connection: createRedisConnection({ lazyConnect: false }),
    concurrency: 10, // Podemos processar vários webhooks simultaneamente
  }
);

// Lógica de processamento de participantes
async function processGroupParticipants(payload: EvolutionGroupParticipantPayload) {
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
    const { extractPhoneVariants, matchesPhoneNumber, cleanDigits } = await import("../lib/phone-utils");
    const matchedLeadIds: string[] = [];

    for (const participant of participants) {
      const rawId = typeof participant === "string" ? participant : participant?.id || "";
      if (!rawId || (rawId.includes("@lid") && !rawId.includes("@s.whatsapp.net"))) {
        continue;
      }

      const rawPhone = rawId.split("@")[0].split(":")[0];
      const digits = cleanDigits(rawPhone);
      if (!digits || digits.length < 8) continue;

      const variants = extractPhoneVariants(rawPhone);
      const base8 = digits.slice(-8);
      const last4 = digits.slice(-4);

      const candidateLeads = await prisma.lead.findMany({
        where: {
          tenantId,
          campaignId: group.campaignId,
          status: { in: ["PENDING", "NOT_JOINED"] },
          OR: [
            ...variants.map((v) => ({ whatsapp: v })),
            { whatsapp: { contains: base8 } },
            { whatsapp: { contains: last4 } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const matchedLead = candidateLeads.find((lead) =>
        matchesPhoneNumber(lead.whatsapp, rawPhone)
      );

      if (matchedLead) {
        matchedLeadIds.push(matchedLead.id);
      }
    }

    // Transação atômica para atualizar leads e contagem consolidada
    await prisma.$transaction([
      ...matchedLeadIds.map((leadId) =>
        prisma.lead.update({
          where: { id: leadId },
          data: { status: "JOINED", joinedAt: new Date(), groupId: group.id },
        })
      ),
      prisma.group.update({
        where: { id: group.id },
        data: { currentCount: { increment: participants.length } },
      }),
    ]);
    
  } else if (action === "remove") {
    const { extractPhoneVariants, cleanDigits } = await import("../lib/phone-utils");
    const newCount = Math.max(0, group.currentCount - participants.length);

    const orClauses = participants.flatMap((participant) => {
      const rawId = typeof participant === "string" ? participant : participant?.id || "";
      if (!rawId) return [];
      const rawPhone = rawId.split("@")[0].split(":")[0];
      const digits = cleanDigits(rawPhone);
      if (!digits || digits.length < 8) return [];
      const variants = extractPhoneVariants(rawPhone);
      const base8 = digits.slice(-8);
      return [
        ...variants.map((v) => ({ whatsapp: v })),
        { whatsapp: { contains: base8 } },
      ];
    });

    // Transação atômica para atualizar grupo e status dos leads
    await prisma.$transaction([
      prisma.group.update({ where: { id: group.id }, data: { currentCount: newCount } }),
      ...(orClauses.length > 0
        ? [
            prisma.lead.updateMany({
              where: {
                tenantId,
                groupId: group.id,
                status: "JOINED",
                OR: orClauses,
              },
              data: { status: "NOT_JOINED" },
            }),
          ]
        : []),
    ]);
  }
}

async function processConnectionUpdate(payload: EvolutionConnectionPayload) {
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

leadsWorker.on("failed", (job, err) => console.error(`[BullMQ] Leads job ${job?.id} falhou (attempt ${job?.attemptsMade}): ${err.message}`));
viewsWorker.on("failed", (job, err) => console.error(`[BullMQ] Views job ${job?.id} falhou (attempt ${job?.attemptsMade}): ${err.message}`));
groupsWorker.on("failed", (job, err) => console.error(`[BullMQ] Groups job ${job?.id} falhou (attempt ${job?.attemptsMade}): ${err.message}`));
webhooksWorker.on("failed", (job, err) => console.error(`[BullMQ] Webhooks job ${job?.id} falhou (attempt ${job?.attemptsMade}): ${err.message}`));

console.log("✅ Workers escutando filas: leads, views, groups, webhooks...");

