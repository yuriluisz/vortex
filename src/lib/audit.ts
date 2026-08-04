import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@/lib/prisma-types";

/**
 * Registra uma ação no audit log.
 *
 * Segurança S8: todas as ações críticas são registradas com IP, userId e tenantId.
 * Isso garante rastreabilidade completa (non-repudiation).
 *
 * O audit log NUNCA deve quebrar a operação principal — erros são apenas logados.
 */
export async function logAudit(
  action: AuditAction,
  details?: Record<string, unknown>,
  userId?: string,
  tenantId?: string
): Promise<void> {
  try {
    const headersList = await headers();
    const ip =
      headersList.get("cf-connecting-ip") ||
      headersList.get("x-real-ip") ||
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    await prisma.auditLog.create({
      data: {
        action,
        details: details as any,
        ip,
        userId: userId ?? null,
        tenantId: tenantId ?? null,
      },
    });
  } catch (error) {
    // Audit log nunca deve quebrar a operação principal
    console.error("Failed to write audit log:", error);
  }
}
