import { NextResponse } from "next/server";
import { webhooksQueue } from "@/lib/queue";

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
    // Validar autenticação via apikey header ou query param (token)
    const expectedKey = (process.env.EVOLUTION_API_KEY || "").trim();
    const url = new URL(request.url);
    const queryToken = url.searchParams.get("token") || "";
    const receivedKey = (request.headers.get("apikey") || queryToken).trim();

    if (!expectedKey || !receivedKey || receivedKey !== expectedKey) {
      console.warn(`[Webhook Evolution] ❌ Token inválido — rejeitando.`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const event = body.event as string;

    if (!event) {
      return NextResponse.json({ error: "Missing event" }, { status: 400 });
    }

    if (event === "group-participants.update" || event === "connection.update") {
      // Joga para processamento em background (Workers)
      await webhooksQueue.add("evolution-webhook", body);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook Evolution] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

