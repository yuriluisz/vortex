"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { UAParser } from "ua-parser-js";

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
 * Captura headers Cloudflare, device info, e salva no banco.
 */
export async function submitLeadAction(
  state: LeadFormState,
  formData: FormData
): Promise<LeadFormState> {
  const campaignId = formData.get("campaignId") as string;
  const slug = formData.get("slug") as string;

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

  // Capturar headers do Cloudflare e metadata
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || headersList.get("cf-connecting-ip") || "unknown";
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
    if (
      key.startsWith("field_") &&
      typeof value === "string"
    ) {
      answers[key] = value;
    }
  }

  // Data e hora local da submissão
  const now = new Date();
  const datadb = now.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }); // DD/MM/YYYY
  const horadb = now.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false }); // HH:MM:SS

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
    await prisma.lead.create({
      data: {
        campaignId: parsed.data.campaignId,
        name: parsed.data.name || null,
        whatsapp: parsed.data.whatsapp || "Não informado",
        answers: Object.keys(answers).length > 0 ? answers : undefined,
        metadata,
        datadb,
        horadb,
      },
    });
  } catch (error) {
    console.error("Error creating lead:", error);
    return { error: "Erro ao registrar. Tente novamente." };
  }

  // Redirecionar para a página de redirect (rotacionador)
  redirect(`/${slug}/redirect`);
}
