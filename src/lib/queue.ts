import { Queue } from "bullmq";
import Redis from "ioredis";

// Cada fila/worker no BullMQ precisa de conexões independentes
const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Fila para gravação de Leads em background
export const leadsQueue = new Queue("leads-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000, // tenta de novo em 1s, depois 2s, depois 4s...
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Fila para gravação de Page Views em background
export const viewsQueue = new Queue("views-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
