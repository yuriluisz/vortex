import "server-only";
import type { ActionState } from "@/app/admin/actions";

/**
 * Verifica que um recurso pertence ao tenant do usuário logado.
 * Retorna o registro se OK, ou ActionState com erro se não.
 */
export async function requireTenantOwnership<T extends { tenantId?: string | null }>(
  model: { findUnique: (args: { where: { id: string } }) => Promise<unknown> },
  id: string,
  tenantId: string,
  label = "Recurso"
): Promise<{ data: T; error?: never } | { data?: never; error: ActionState }> {
  const record = (await model.findUnique({ where: { id } })) as T | null;
  if (!record) {
    return { error: { error: `${label} não encontrado.` } };
  }
  if (record.tenantId !== tenantId) {
    return { error: { error: `${label} não pertence a este tenant.` } };
  }
  return { data: record };
}