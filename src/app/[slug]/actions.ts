"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UAParser } from "ua-parser-js";
import { logAudit } from "@/lib/audit";
import { leadsQueue, viewsQueue } from "@/lib/queue";
import { canCreateResource, getLimitForPlan, isUnlimited } from "@/lib/plans";
import { getCachedCampaignData, getCachedLeadCount } from "@/lib/campaign-cache";

const LeadSchema = z.object({
  campaignId: z.string().uuid(),
  slug: z.string().min(1),
  name: z.string().optional(),
  whatsapp: z.string().optional(),
});

export type LeadFormState = {
  success?: boolean;
  error?: string;
} | undefined;

/**
 * Server Action: Submissão do formulário dinâmico de lead.
 * Agora é tenant-aware: busca o tenantId da campanha e salva junto.
 * Captura headers Cloudflare, device info, e salva no banco.
 */
export async function submitLeadAction(
  state: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const campaignId = formData.get("campaignId") as string;
  const slug = formData.get("slug") as string;
  const isCustomDomain = formData.get("isCustomDomain") === "true";

  // Validação base
  const parsed = LeadSchema.safeParse({
    campaignId,
    slug,
    name: formData.get("name") || undefined,
    whatsapp: formData.get("whatsapp"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message || "Dados inválidos.",
    };
  }

  // Buscar campanha e dados do tenant via Cache
  const cachedData = await getCachedCampaignData(campaignId);

  if (!cachedData || !cachedData.active) {
    return { error: "Campanha não encontrada ou inativa." };
  }

  // Verificar limite de leads do plano
  const limit = getLimitForPlan(cachedData.plan, "leads");

  // Otimização Extrema: Se o plano for ilimitado (ULTRA), pulamos a contagem
  // de leads inteiramente, poupando o cache e o banco de dados.
  if (!isUnlimited(limit)) {
    const currentCount = await getCachedLeadCount(cachedData.tenantId);
    const limitCheck = canCreateResource(cachedData.plan, "leads", currentCount);
    if (!limitCheck.allowed) {
      return { error: limitCheck.reason };
    }
  }

  // Capturar headers do Cloudflare e metadata
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for") ||
    headersList.get("cf-connecting-ip") ||
    "unknown";
  const country = headersList.get("cf-ipcountry") || "unknown";
  const city = headersList.get("cf-ipcity") || "unknown";
  const userAgentString = headersList.get("user-agent") || "";

  // Parsear user-agent
  const uaResult = UAParser(userAgentString);
  const device = uaResult.device;
  const browser = uaResult.browser;
  const os = uaResult.os;

  // Coletar respostas dinâmicas do formSchema
  const answers: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("field_") && typeof value === "string") {
      answers[key] = value;
    }
  }

  // Data e hora local da submissão
  const now = new Date();
  const datadb = now.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }); // DD/MM/YYYY
  const horadb = now.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
  }); // HH:MM:SS

  // Metadata
  const metadata = {
    ip,
    country,
    city,
    userAgent: userAgentString,
    device: {
      type: device.type || "desktop",
      vendor: device.vendor || "unknown",
      model: device.model || "unknown",
    },
    browser: {
      name: browser.name || "unknown",
      version: browser.version || "unknown",
    },
    os: {
      name: os.name || "unknown",
      version: os.version || "unknown",
    },
  };

  try {
    // Adiciona o lead à fila do BullMQ para processamento em background,
    // liberando o usuário instantaneamente para o redirecionamento.
    await leadsQueue.add("process-lead", {
      campaignId: parsed.data.campaignId,
      tenantId: cachedData.tenantId,
      name: parsed.data.name || null,
      whatsapp: parsed.data.whatsapp || "Não informado",
      answers: Object.keys(answers).length > 0 ? answers : undefined,
      metadata,
      datadb,
      horadb,
    });
  } catch (error) {
    console.error("Error queueing lead:", error);
    // Mesmo se falhar a fila (muito raro se o Redis estiver online),
    // poderíamos fazer fallback pro Postgres direto, mas num pico isso
    // seria arriscado. Vamos apenas alertar e continuar.
  }

  // Redirecionar para a página de redirect (rotacionador)
  if (isCustomDomain) {
    redirect(`/redirect`);
  } else {
    redirect(`/${slug}/redirect`);
  }
}

/**
 * Server Action: Incrementa o número de views de uma campanha em background via BullMQ.
 */
export async function trackCampaignViewAction(campaignId: string) {
  try {
    const cachedData = await getCachedCampaignData(campaignId);

    if (!cachedData) return;

    // Adiciona à fila para registro assíncrono (evita lock contention no BD)
    await viewsQueue.add("process-view", {
      campaignId,
      tenantId: cachedData.tenantId,
    });
  } catch (error) {
    // Falha silenciosa para não quebrar a página
    console.error("Error tracking view:", error);
  }
}