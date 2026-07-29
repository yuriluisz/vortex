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

leadsWorker.on("failed", (job, err) => {
  console.error(`[BullMQ] Job ${job?.id} da fila leads-queue falhou. Motivo: ${err.message}`);
});

viewsWorker.on("failed", (job, err) => {
  console.error(`[BullMQ] Job ${job?.id} da fila views-queue falhou. Motivo: ${err.message}`);
});

console.log("✅ Workers escutando filas 'leads-queue' e 'views-queue'...");
