"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { uploadImageToR2, deleteFileFromR2 } from "@/lib/r2";
import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";
import { sanitizeFilename } from "@/lib/asset-resolver";

// ============================================================================
// CONTRATOS & TIPOS
// ============================================================================

export interface TenantAssetDTO {
  id: string;
  tenantId: string;
  filename: string;
  key: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

export type AssetActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  asset?: TenantAssetDTO;
  assets?: TenantAssetDTO[];
  error?: string;
  details?: unknown;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
]);

const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/vnd.microsoft.icon": "image/x-icon",
};

// ============================================================================
// SEGURANÇA & SANITIZAÇÃO
// ============================================================================

async function requireAuth() {
  const session = await getSession();
  if (!session?.email || !session.tenantId) {
    throw new Error("Não autorizado.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { id: true, active: true },
  });

  if (!tenant || !tenant.active) {
    throw new Error("Sessão inválida ou tenant inativo.");
  }

  return {
    userId: session.userId,
    tenantId: tenant.id,
  };
}

/**
 * Validação de Magic Bytes para imagens binárias conhecidas.
 */
function validateBinarySignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (mimeType === "image/x-icon") {
    return (
      buffer.length >= 4 &&
      buffer[0] === 0x00 &&
      buffer[1] === 0x00 &&
      buffer[2] === 0x01 &&
      buffer[3] === 0x00
    );
  }
  return true;
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Faz upload de um asset do tenant para o Cloudflare R2 e cadastra/atualiza no banco.
 * Suporta chamada direta uploadTenantAssetAction(formData) ou via useActionState.
 */
export async function uploadTenantAssetAction(
  formDataOrState: FormData | unknown,
  maybeFormData?: FormData
): Promise<AssetActionResult> {
  let authContext: { tenantId: string; userId: string };
  try {
    authContext = await requireAuth();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Não autorizado.",
    };
  }

  const formData = formDataOrState instanceof FormData ? formDataOrState : maybeFormData;
  if (!formData || !(formData instanceof FormData)) {
    return {
      success: false,
      error: "Dados do formulário inválidos.",
    };
  }

  const file = (formData.get("file") || formData.get("asset")) as File | null;
  if (!file || !(file instanceof File) || file.size === 0) {
    return {
      success: false,
      error: "Nenhum arquivo de imagem foi enviado.",
    };
  }

  // 1. Limite de tamanho (5MB)
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "O arquivo excede o limite máximo permitido de 5MB.",
    };
  }

  // 2. Validação e normalização de MIME type
  let rawMime = file.type?.toLowerCase().trim() || "";
  if (MIME_ALIASES[rawMime]) {
    rawMime = MIME_ALIASES[rawMime];
  }

  if (!ALLOWED_MIME_TYPES.has(rawMime)) {
    return {
      success: false,
      error: "Tipo de arquivo não permitido. Use apenas PNG, JPEG, WEBP, SVG ou ICO.",
    };
  }

  // 3. Sanitização do filename contra path-traversal
  let safeFilename: string;
  try {
    safeFilename = sanitizeFilename(file.name);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Nome de arquivo inválido.",
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // 4. Validação e sanitização profunda de conteúdo
    if (rawMime === "image/svg+xml") {
      const svgText = buffer.toString("utf-8");
      // Sanitiza SVG contra XSS/scripts maliciosos
      const cleanSvg = DOMPurify.sanitize(svgText, {
        USE_PROFILES: { svg: true, svgFilters: true },
      });

      if (!cleanSvg || !cleanSvg.includes("<svg")) {
        return {
          success: false,
          error: "Arquivo SVG inválido ou corrompido.",
        };
      }
      buffer = Buffer.from(cleanSvg, "utf-8");
    } else {
      // Validação de assinatura binária (Magic Bytes)
      if (!validateBinarySignature(buffer, rawMime)) {
        return {
          success: false,
          error: "Conteúdo do arquivo não corresponde a uma imagem válida.",
        };
      }
    }

    // 5. Upload no Cloudflare R2
    const key = `assets/${authContext.tenantId}/${safeFilename}`;
    const url = await uploadImageToR2(key, buffer, rawMime);

    // 6. Persistência / Upsert no Prisma TenantAsset
    const asset = await prisma.tenantAsset.upsert({
      where: {
        tenantId_filename: {
          tenantId: authContext.tenantId,
          filename: safeFilename,
        },
      },
      create: {
        tenantId: authContext.tenantId,
        filename: safeFilename,
        key,
        url,
        mimeType: rawMime,
        size: buffer.length,
      },
      update: {
        key,
        url,
        mimeType: rawMime,
        size: buffer.length,
        createdAt: new Date(),
      },
    });

    return {
      success: true,
      asset: {
        id: asset.id,
        tenantId: asset.tenantId,
        filename: asset.filename,
        key: asset.key,
        url: asset.url,
        mimeType: asset.mimeType,
        size: asset.size,
        createdAt: asset.createdAt,
      },
    };
  } catch (error) {
    console.error("Erro no upload de asset do tenant:", error);
    return {
      success: false,
      error: "Erro interno ao processar e salvar o arquivo.",
    };
  }
}

/**
 * Lista todos os assets pertencentes ao tenant autenticado.
 */
export async function listTenantAssetsAction(): Promise<AssetActionResult> {
  try {
    const { tenantId } = await requireAuth();

    const assets = await prisma.tenantAsset.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      assets: assets.map((a) => ({
        id: a.id,
        tenantId: a.tenantId,
        filename: a.filename,
        key: a.key,
        url: a.url,
        mimeType: a.mimeType,
        size: a.size,
        createdAt: a.createdAt,
      })),
    };
  } catch (error) {
    console.error("Erro ao listar assets do tenant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao carregar lista de assets.",
    };
  }
}

const DeleteAssetSchema = z.object({
  assetId: z.string().min(1, "ID de asset inválido."),
});

/**
 * Remove um asset do tenant (R2 e banco de dados).
 */
export async function deleteTenantAssetAction(assetId: string): Promise<AssetActionResult> {
  try {
    const { tenantId } = await requireAuth();

    const parseResult = DeleteAssetSchema.safeParse({ assetId });
    if (!parseResult.success) {
      return {
        success: false,
        error: "ID de asset inválido.",
      };
    }

    const asset = await prisma.tenantAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      return {
        success: false,
        error: "Arquivo não encontrado.",
      };
    }

    if (asset.tenantId !== tenantId) {
      return {
        success: false,
        error: "Acesso negado: o arquivo não pertence a este tenant.",
      };
    }

    // 1. Deletar do Cloudflare R2
    await deleteFileFromR2(asset.key);

    // 2. Remover do banco de dados
    await prisma.tenantAsset.delete({
      where: { id: assetId },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Erro ao deletar asset do tenant:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao excluir asset.",
    };
  }
}
