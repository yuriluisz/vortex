import { NextResponse } from "next/server";
import { uploadTenantAssetAction } from "@/app/admin/assets/actions";

/**
 * POST /api/assets/upload — upload de mídia do tenant (multipart, campo "file").
 *
 * Rota em vez de server action: o WAF da Cloudflare ("React - Leaking Server Functions")
 * dá falso positivo em bytes de imagem enviados como server action, e server actions
 * limitam o corpo a 1MB. Auth e validação ficam na action; CSRF coberto pelo cookie SameSite=lax.
 */
export async function POST(request: Request) {
  const result = await uploadTenantAssetAction(await request.formData());
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
