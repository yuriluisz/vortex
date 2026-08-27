import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getConnectionState } from "@/lib/evolution";

/**
 * GET /api/whatsapp/status
 *
 * Retorna o status da conexão WhatsApp do tenant.
 * Usado pelo toast global para polling.
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session?.tenantId) {
      return NextResponse.json(
        { connected: false, error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Verificar se é plano ULTRA
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { plan: true },
    });

    if (!tenant || tenant.plan !== "ULTRA") {
      return NextResponse.json({
        connected: false,
        hasFeature: false,
      });
    }

    // Buscar instância
    const instance = await prisma.evolutionInstance.findUnique({
      where: { tenantId: session.tenantId },
      select: {
        instanceName: true,
        phoneNumber: true,
        status: true,
      },
    });

    if (!instance) {
      return NextResponse.json({
        connected: false,
        hasFeature: true,
        configured: false,
      });
    }

    // Verificar status real na Evolution API (se estava conectado)
    let realStatus = instance.status;

    if (instance.status === "CONNECTED") {
      try {
        const state = await getConnectionState(instance.instanceName);
        const stateMap: Record<string, string> = {
          open: "CONNECTED",
          close: "DISCONNECTED",
          connecting: "CONNECTING",
        };
        realStatus = stateMap[state.instance.state] || "DISCONNECTED";

        // Atualizar no banco se mudou
        if (realStatus !== instance.status) {
          await prisma.evolutionInstance.update({
            where: { tenantId: session.tenantId },
            data: { status: realStatus },
          });
        }
      } catch {
        // Se a API falhou, manter o status do banco
      }
    }

    return NextResponse.json({
      connected: realStatus === "CONNECTED",
      hasFeature: true,
      configured: true,
      phoneNumber: instance.phoneNumber,
      status: realStatus,
    });
  } catch (error) {
    console.error("[WhatsApp Status] Error:", error);
    return NextResponse.json(
      { connected: false, error: "Erro interno" },
      { status: 500 }
    );
  }
}
