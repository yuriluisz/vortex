import { Queue } from "bullmq";
import { redis } from "./redis";

// Usamos a conexão do ioredis já existente
const connection = redis;

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
