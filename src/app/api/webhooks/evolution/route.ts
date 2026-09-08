import { NextResponse } from "next/server";
import { webhooksQueue } from "@/lib/queue";
import crypto from "crypto";

function safeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ============================================================================
// WEBHOOK HANDLER — Evolution API
// ============================================================================

/**
 * POST /api/webhooks/evolution
 *
 * Recebe eventos da Evolution API:
 * - GROUP_PARTICIPANTS_UPDATE: Participante entrou/saiu do grupo
 * - CONNECTION_UPDATE: Status de conexão mudou
 * 
 * Agora 100% assíncrono: apenas joga na fila do BullMQ e retorna 200 OK
 * para evitar timeouts e estouro de conexões do banco em picos de tráfego.
 */
export async function POST(request: Request) {
  try {
    // 🔒 Segurança: Autenticação obrigatória via header apikey com comparação em tempo constante
    const expectedKey = (process.env.EVOLUTION_API_KEY || "").trim();
    const receivedKey = (request.headers.get("apikey") || "").trim();

    if (!expectedKey || !receivedKey || !safeCompare(receivedKey, expectedKey)) {
      console.warn(`[Webhook Evolution] ❌ Token inválido ou ausente no header apikey — rejeitando.`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const event = body.event as string;

    const normalizedEvent = (event || "").toLowerCase().replace(/[-_.]/g, "");
    const isGroupParticipants =
      normalizedEvent === "groupparticipantsupdate" ||
      normalizedEvent === "groupsparticipantsupdate";
    const isConnection = normalizedEvent === "connectionupdate";

    if (isGroupParticipants || isConnection) {
      // Joga para processamento em background (Workers) padronizado
      await webhooksQueue.add("evolution-webhook", {
        ...body,
        event: isGroupParticipants ? "group-participants.update" : "connection.update",
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook Evolution] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

