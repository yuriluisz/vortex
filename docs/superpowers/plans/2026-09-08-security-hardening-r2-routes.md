# Security Hardening: R2 Storage, Uploads, Routes & Cloudflare Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Blindar a segurança de ponta a ponta nas integrações com Cloudflare R2, uploads de imagens (avatar/templates), rotas de API públicas/privadas e background workers contra Content-Type spoofing, Path Traversal, SSRF, DoS por exaustão e Timing Attacks.

**Architecture:** Implementar validação criptográfica/estrutural de magic bytes para imagens em `src/lib/image-validator.ts`, sanitização de chaves R2 em `src/lib/r2.ts`, rate limiting em server actions de upload, proteção SSRF contra IPs privados/metadados no worker de imagens, timingSafeEqual no webhook do Asaas e teto de descompressão (zip bomb protection) no replay stream.

**Tech Stack:** Next.js 16 (App Router), TypeScript 5, Node.js `crypto`, `zlib`, `@aws-sdk/client-s3`, Vitest 4, Prisma 7.

## Global Constraints
- Ponytail discipline: reutilizar bibliotecas padrão do Node.js (`crypto`, `dns/promises`, `zlib`, `@/lib/rate-limit`) sem novas dependências externas.
- Limite máximo de arquivo: 5MB.
- Mimetypes e Magic Bytes aceitos: JPEG, PNG, WEBP, GIF.
- Não quebrar o comportamento de rotas públicas existentes (ingestão de gravação, webhooks).
- Testes unitários para cada camada de segurança.

---

### Task 1: Validador de Magic Bytes para Imagens (`src/lib/image-validator.ts`)

**Files:**
- Create: `src/lib/image-validator.ts`
- Create: `src/tests/image-validator.test.ts`
- Modify: `src/app/admin/settings/profile-actions.ts`
- Modify: `src/app/admin/templates/actions.ts`

**Interfaces:**
- Produces:
  - `validateImageBuffer(buffer: Buffer): { valid: boolean; mimeType?: string; ext?: string; error?: string }`

- [ ] **Step 1: Escrever teste unitário para validação de magic bytes**

```typescript
// src/tests/image-validator.test.ts
import { describe, it, expect } from "vitest";
import { validateImageBuffer } from "@/lib/image-validator";

describe("Image Magic Bytes Validator", () => {
  it("should validate JPEG magic bytes (FF D8 FF)", () => {
    const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
    const result = validateImageBuffer(jpegBuffer);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.ext).toBe("jpg");
  });

  it("should validate PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)", () => {
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const result = validateImageBuffer(pngBuffer);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("image/png");
    expect(result.ext).toBe("png");
  });

  it("should validate WEBP magic bytes (RIFF....WEBP)", () => {
    const webpHeader = Buffer.from("RIFF1234WEBPVP8 ");
    const result = validateImageBuffer(webpHeader);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("image/webp");
    expect(result.ext).toBe("webp");
  });

  it("should validate GIF magic bytes (GIF87a or GIF89a)", () => {
    const gifBuffer = Buffer.from("GIF89a\x01\x00\x01\x00");
    const result = validateImageBuffer(gifBuffer);
    expect(result.valid).toBe(true);
    expect(result.mimeType).toBe("image/gif");
    expect(result.ext).toBe("gif");
  });

  it("should reject spoofed files (e.g. HTML or text with image extension)", () => {
    const fakeBuffer = Buffer.from("<script>alert('xss')</script>");
    const result = validateImageBuffer(fakeBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

- [ ] **Step 2: Executar teste e verificar falha**

Run: `npx vitest run src/tests/image-validator.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar `validateImageBuffer` em `src/lib/image-validator.ts`**

```typescript
// src/lib/image-validator.ts
export interface ImageValidationResult {
  valid: boolean;
  mimeType?: string;
  ext?: string;
  error?: string;
}

export function validateImageBuffer(buffer: Buffer): ImageValidationResult {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: "Arquivo muito pequeno ou vazio para ser uma imagem válida." };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, mimeType: "image/jpeg", ext: "jpg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, mimeType: "image/png", ext: "png" };
  }

  // 3. GIF: GIF87a ou GIF89a
  const isGif87a = buffer.subarray(0, 6).toString("ascii") === "GIF87a";
  const isGif89a = buffer.subarray(0, 6).toString("ascii") === "GIF89a";
  if (isGif87a || isGif89a) {
    return { valid: true, mimeType: "image/gif", ext: "gif" };
  }

  // 4. WEBP: RIFF + (4 bytes length) + WEBP
  const isRiff = buffer.subarray(0, 4).toString("ascii") === "RIFF";
  const isWebp = buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (isRiff && isWebp) {
    return { valid: true, mimeType: "image/webp", ext: "webp" };
  }

  return { valid: false, error: "Assinatura de imagem inválida (apenas JPEG, PNG, WEBP e GIF permitidos)." };
}
```

- [ ] **Step 4: Integrar `validateImageBuffer` em `uploadAvatarAction` e `publishTemplateAction`**
  - No `uploadAvatarAction`: após ler o buffer, chamar `validateImageBuffer(buffer)` antes do envio ao R2.
  - No `publishTemplateAction`: chamar `validateImageBuffer(buffer)` para a thumbnail antes de subir ao R2.
  - No `saveTemplateEditAction`: chamar `validateImageBuffer(buffer)` se novo arquivo for enviado.

- [ ] **Step 5: Executar teste e verificar sucesso**

Run: `npx vitest run src/tests/image-validator.test.ts`
Expected: PASS

---

### Task 2: Sanitização de Chaves R2 e Blindagem de Path Traversal (`src/lib/r2.ts`)

**Files:**
- Modify: `src/lib/r2.ts`
- Modify: `src/app/api/analytics/recordings/ingest/route.ts`
- Modify: `src/tests/r2-images.test.ts`

**Interfaces:**
- Produces:
  - `sanitizeR2Key(key: string): string` em `src/lib/r2.ts`

- [ ] **Step 1: Adicionar testes de rejeição de Path Traversal no R2**

```typescript
// no src/tests/r2-images.test.ts
it("should throw error on path traversal attempts in R2 keys", async () => {
  const { uploadImageToR2, sanitizeR2Key } = await import("@/lib/r2");
  expect(() => sanitizeR2Key("../avatars/secret.png")).toThrow();
  expect(() => sanitizeR2Key("avatars/../../etc/passwd")).toThrow();
  expect(sanitizeR2Key("avatars/user-123.png")).toBe("avatars/user-123.png");
});
```

- [ ] **Step 2: Implementar `sanitizeR2Key` em `src/lib/r2.ts`**

```typescript
export function sanitizeR2Key(key: string): string {
  if (!key || typeof key !== "string") {
    throw new Error("Chave do R2 inválida.");
  }

  const cleanKey = key.replace(/^\/+/, "").trim();

  // Bloquear tentativas de traversal de diretório
  if (cleanKey.includes("..") || cleanKey.includes("\\") || cleanKey.includes("\0")) {
    throw new Error("Chave do R2 não permitida (path traversal detectado).");
  }

  // Permitir apenas caracteres seguros
  if (!/^[a-zA-Z0-9_\-\./]+$/.test(cleanKey)) {
    throw new Error("Chave do R2 contém caracteres inválidos.");
  }

  return cleanKey;
}
```

- [ ] **Step 3: Aplicar `sanitizeR2Key` em `uploadImageToR2`, `uploadReplayPayload`, `getReplayPayload` e `deleteFileFromR2`**

- [ ] **Step 4: Validar regex de `sessionId` e `campaignId` em `ingest/route.ts`**

```typescript
const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;
const UUID_REGEX = /^[0-9a-fA-F-]{36}$/;

if (!UUID_REGEX.test(campaignId) || !SESSION_ID_REGEX.test(sessionId)) {
  return NextResponse.json({ error: "Identificadores inválidos." }, { status: 400 });
}
```

- [ ] **Step 5: Rodar testes do R2**

Run: `npx vitest run src/tests/r2-images.test.ts`
Expected: PASS

---

### Task 3: Rate Limiting nos Uploads de Imagens

**Files:**
- Modify: `src/app/admin/settings/profile-actions.ts`
- Modify: `src/app/admin/templates/actions.ts`
- Create: `src/tests/upload-ratelimit.test.ts`

- [ ] **Step 1: Escrever teste para rate limiting de upload de avatar**

```typescript
// src/tests/upload-ratelimit.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.RESEND_API_KEY = "re_test";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/r2", () => ({
  uploadImageToR2: vi.fn().mockResolvedValue("https://r2.vortexpages.online/avatars/user-1.png"),
  deleteFileFromR2: vi.fn().mockResolvedValue(true),
  R2_PUBLIC_URL: "https://r2.vortexpages.online",
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn().mockResolvedValue({ userId: "user-1", tenantId: "tenant-1", role: "ADMIN" }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn().mockResolvedValue({ id: "user-1" }), update: vi.fn() },
    tenant: { findUnique: vi.fn().mockResolvedValue({ id: "tenant-1", plan: "PRO" }) },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockResolvedValueOnce({ allowed: true }).mockResolvedValueOnce({ allowed: false, resetIn: 60 }),
  RATE_LIMITS: { auth: { windowSeconds: 60, maxRequests: 5 } },
}));

describe("Upload Rate Limiting", () => {
  it("should block excessive upload attempts with 429 error", async () => {
    const { uploadAvatarAction } = await import("@/app/admin/settings/profile-actions");
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);
    const file = new File([validPng], "avatar.png", { type: "image/png" });

    const form1 = new FormData();
    form1.append("avatar", file);
    const res1 = await uploadAvatarAction(undefined, form1);
    expect(res1.success).toBe(true);

    const form2 = new FormData();
    form2.append("avatar", file);
    const res2 = await uploadAvatarAction(undefined, form2);
    expect(res2.error).toContain("Muitas tentativas");
  });
});
```

- [ ] **Step 2: Aplicar verificação de `rateLimit` no `uploadAvatarAction` e `publishTemplateAction`**
  - Avatar: chave `upload:avatar:${userId}`, limite 5 requisições/minuto.
  - Template: chave `upload:template:${tenantId}`, limite 10 requisições/minuto.

- [ ] **Step 3: Rodar teste e verificar sucesso**

Run: `npx vitest run src/tests/upload-ratelimit.test.ts`
Expected: PASS

---

### Task 4: SSRF Protection no Worker e Zip Bomb Protection no Stream

**Files:**
- Modify: `src/workers/index.ts`
- Modify: `src/app/api/analytics/recordings/[id]/stream/route.ts`
- Create: `src/tests/ssrf-protection.test.ts`

- [ ] **Step 1: Escrever teste para validador de URL segura contra SSRF**

```typescript
// src/tests/ssrf-protection.test.ts
import { describe, it, expect } from "vitest";
import { isSafePublicUrl } from "@/lib/ssrf-guard";

describe("SSRF Guard", () => {
  it("should allow public HTTPS URLs", () => {
    expect(isSafePublicUrl("https://r2.vortexpages.online/templates/test.png")).toBe(true);
    expect(isSafePublicUrl("https://images.unsplash.com/photo-123.jpg")).toBe(true);
  });

  it("should reject private IPs, loopbacks and cloud metadata", () => {
    expect(isSafePublicUrl("http://localhost:3000")).toBe(false);
    expect(isSafePublicUrl("http://127.0.0.1:6379")).toBe(false);
    expect(isSafePublicUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isSafePublicUrl("http://10.0.0.1")).toBe(false);
    expect(isSafePublicUrl("http://192.168.1.1")).toBe(false);
    expect(isSafePublicUrl("ftp://example.com/file")).toBe(false);
  });
});
```

- [ ] **Step 2: Implementar `isSafePublicUrl` em `src/lib/ssrf-guard.ts`**
  - Rejeitar protocolos diferentes de `http:` e `https:`.
  - Rejeitar hostnames `localhost`, ranges privados `10.`, `127.`, `192.168.`, `172.16-31.`, `169.254.` (metadata da AWS/Cloudflare) e IPv6 local `::1`, `fe80:`.

- [ ] **Step 3: Aplicar `isSafePublicUrl`, timeout e limite de 5MB no fetch de imagens do Worker (`src/workers/index.ts`)**
  - Se `!isSafePublicUrl(campaign.groupImageUrl)`, abortar sem tentar baixar.
  - Usar `signal: AbortSignal.timeout(5000)`.

- [ ] **Step 4: Adicionar teto de descompressão (zip bomb protection) em `stream/route.ts`**
  - Configurar `gunzipSync(gzipBuffer, { maxOutputLength: 20 * 1024 * 1024 })` (máximo de 20MB descomprimidos).

- [ ] **Step 5: Rodar teste do SSRF Guard**

Run: `npx vitest run src/tests/ssrf-protection.test.ts`
Expected: PASS

---

### Task 5: Timing-Safe Equal no Webhook do Asaas (`src/app/api/webhooks/asaas/route.ts`)

**Files:**
- Modify: `src/app/api/webhooks/asaas/route.ts:55-65`
- Create: `src/tests/asaas-webhook-security.test.ts`

- [ ] **Step 1: Escrever teste para validação do token do Asaas com tempo constante**
- [ ] **Step 2: Substituir comparação direta `===` por `crypto.timingSafeEqual` com buffers de mesmo tamanho**
- [ ] **Step 3: Rodar teste de segurança do webhook do Asaas**

---

### Task 6: Bateria Completa de Validação e Quality Gate

- [ ] **Step 1: Rodar todos os testes unitários**
Run: `npm test`
Expected: 100% testes passando.

- [ ] **Step 2: Typecheck do TypeScript**
Run: `npx tsc --noEmit`
Expected: 0 erros.

- [ ] **Step 3: Linter**
Run: `npm run lint`
Expected: 0 novos erros.

- [ ] **Step 4: Git Commit com mensagem convencional**
Run: `git commit -m "security(core): harden r2 uploads, ssrf guards, path traversal and webhook validations"`
