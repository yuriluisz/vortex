# R2 Image Storage (Avatar & Templates) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar o armazenamento de fotos de perfil (avatares) e imagens de capa/thumbnail de templates para o Cloudflare R2, eliminando strings Base64 do banco de dados e adicionando suporte a upload de capas de templates.

**Architecture:** Expandir `src/lib/r2.ts` com funções utilitárias reutilizando o `@aws-sdk/client-s3` existente para upload e deleção com URLs públicas. Conectar essas funções aos Server Actions de perfil (`profile-actions.ts`) e de templates (`templates/actions.ts`), atualizando os modais de publicação e edição para aceitar arquivos de imagem com preview.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript 5, Cloudflare R2 (`@aws-sdk/client-s3`), Prisma 7 (PostgreSQL), Vitest 4.

## Global Constraints
- Nenhuma dependência externa nova (usar `@aws-sdk/client-s3` já existente).
- Limite máximo de arquivo: 5MB.
- Mimetypes aceitos: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- Manter compatibilidade reversa com URLs legadas (Base64 ou URLs externas).
- Não alterar campos de campanhas (OG Image, Favicon, etc.) — manter YAGNI e disciplina Ponytail.

---

### Task 1: R2 Core Helpers (`src/lib/r2.ts`)

**Files:**
- Modify: `src/lib/r2.ts`
- Create: `src/tests/r2-images.test.ts`

**Interfaces:**
- Produces:
  - `uploadImageToR2(key: string, buffer: Buffer, contentType: string): Promise<string>`
  - `deleteFileFromR2(keyOrUrl: string): Promise<boolean>`

- [ ] **Step 1: Escrever teste unitário para helpers de imagem do R2**

```typescript
// src/tests/r2-images.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@aws-sdk/client-s3", () => {
  const sendMock = vi.fn();
  return {
    S3Client: vi.fn(() => ({ send: sendMock })),
    PutObjectCommand: vi.fn((args) => ({ ...args, _type: "PutObjectCommand" })),
    DeleteObjectCommand: vi.fn((args) => ({ ...args, _type: "DeleteObjectCommand" })),
    GetObjectCommand: vi.fn((args) => ({ ...args, _type: "GetObjectCommand" })),
    sendMock,
  };
});

describe("R2 Image Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upload image buffer to R2 and return public URL", async () => {
    const { uploadImageToR2, R2_PUBLIC_URL } = await import("@/lib/r2");
    const testBuffer = Buffer.from("fake-image");
    const key = "avatars/user-123-12345.png";
    const result = await uploadImageToR2(key, testBuffer, "image/png");

    expect(result).toBe(`${R2_PUBLIC_URL}/${key}`);
  });

  it("should delete file from R2 using key or public URL", async () => {
    const { deleteFileFromR2, R2_PUBLIC_URL } = await import("@/lib/r2");
    const key = "avatars/user-123-12345.png";
    const fullUrl = `${R2_PUBLIC_URL}/${key}`;

    const res1 = await deleteFileFromR2(key);
    expect(res1).toBe(true);

    const res2 = await deleteFileFromR2(fullUrl);
    expect(res2).toBe(true);

    // Ignora URLs externas ou Base64 sem estourar erro
    const res3 = await deleteFileFromR2("data:image/png;base64,123");
    expect(res3).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar teste para verificar falha inicial**

Run: `npx vitest run src/tests/r2-images.test.ts`
Expected: FAIL (uploadImageToR2 e deleteFileFromR2 não definidos)

- [ ] **Step 3: Implementar `uploadImageToR2` e `deleteFileFromR2` em `src/lib/r2.ts`**

```typescript
export async function uploadImageToR2(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteFileFromR2(keyOrUrl: string): Promise<boolean> {
  if (!keyOrUrl || keyOrUrl.startsWith("data:")) return false;

  let key = keyOrUrl;
  if (key.startsWith(R2_PUBLIC_URL)) {
    key = key.slice(R2_PUBLIC_URL.length).replace(/^\/+/, "");
  } else if (key.startsWith("http://") || key.startsWith("https://")) {
    return false; // URL externa não pertence ao bucket R2
  }

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    console.error(`Erro ao deletar arquivo no R2 (${key}):`, error);
    return false;
  }
}
```

- [ ] **Step 4: Rodar teste para verificar sucesso**

Run: `npx vitest run src/tests/r2-images.test.ts`
Expected: PASS

---

### Task 2: Avatar Upload to R2 (`src/app/admin/settings/profile-actions.ts`)

**Files:**
- Modify: `src/app/admin/settings/profile-actions.ts:396-445`
- Create/Modify: `src/tests/profile-avatar-r2.test.ts`

**Interfaces:**
- Consumes:
  - `uploadImageToR2(key, buffer, contentType)` de `@/lib/r2`
  - `deleteFileFromR2(keyOrUrl)` de `@/lib/r2`

- [ ] **Step 1: Escrever teste para o upload de avatar no R2**

```typescript
// src/tests/profile-avatar-r2.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/r2", () => ({
  uploadImageToR2: vi.fn().mockResolvedValue("https://r2.vortexpages.online/avatars/user-1-123.png"),
  deleteFileFromR2: vi.fn().mockResolvedValue(true),
  R2_PUBLIC_URL: "https://r2.vortexpages.online",
}));

vi.mock("@/lib/auth-audit", () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: "user-1", tenantId: "tenant-1" }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: "user-1", avatarUrl: "https://r2.vortexpages.online/avatars/old.png" }),
      update: vi.fn().mockResolvedValue({ id: "user-1" }),
    },
  },
}));

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(true),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("uploadAvatarAction with R2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upload file to R2 and clean previous R2 avatar", async () => {
    const { uploadAvatarAction } = await import("@/app/admin/settings/profile-actions");
    const { uploadImageToR2, deleteFileFromR2 } = await import("@/lib/r2");

    const formData = new FormData();
    const file = new File(["fake-image-bytes"], "avatar.png", { type: "image/png" });
    formData.append("avatar", file);

    const result = await uploadAvatarAction(undefined, formData);

    expect(result.success).toBe(true);
    expect(result.avatarUrl).toBe("https://r2.vortexpages.online/avatars/user-1-123.png");
    expect(uploadImageToR2).toHaveBeenCalled();
    expect(deleteFileFromR2).toHaveBeenCalledWith("https://r2.vortexpages.online/avatars/old.png");
  });
});
```

- [ ] **Step 2: Rodar teste para verificar falha inicial**

Run: `npx vitest run src/tests/profile-avatar-r2.test.ts`
Expected: FAIL (ainda salva Base64)

- [ ] **Step 3: Modificar `uploadAvatarAction` e `removeAvatarAction` em `profile-actions.ts`**
  - Obter usuário atual para checar `avatarUrl` anterior.
  - Se anterior for do R2, chamar `deleteFileFromR2`.
  - Converter arquivo para `Buffer`.
  - Extrair extensão do mimeType.
  - Subir para o R2 com chave `avatars/${userId}-${Date.now()}.${ext}`.
  - Atualizar `User.avatarUrl` com a URL retornada.
  - Em `removeAvatarAction`, chamar `deleteFileFromR2` caso `avatarUrl` existente seja do R2.

- [ ] **Step 4: Rodar teste para verificar sucesso**

Run: `npx vitest run src/tests/profile-avatar-r2.test.ts`
Expected: PASS

---

### Task 3: Template Thumbnail R2 Integration (`src/app/admin/templates`)

**Files:**
- Modify: `src/app/admin/templates/actions.ts`
- Modify: `src/app/admin/templates/publish-modal.tsx`
- Modify: `src/app/admin/templates/edit-template-modal.tsx`
- Modify: `src/services/template.service.ts`
- Create: `src/tests/template-thumbnail-r2.test.ts`

**Interfaces:**
- Consumes:
  - `uploadImageToR2(key, buffer, contentType)` de `@/lib/r2`
  - `deleteFileFromR2(keyOrUrl)` de `@/lib/r2`

- [ ] **Step 1: Escrever teste para thumbnail de templates**

```typescript
// src/tests/template-thumbnail-r2.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/r2", () => ({
  uploadImageToR2: vi.fn().mockResolvedValue("https://r2.vortexpages.online/templates/test-123.webp"),
  deleteFileFromR2: vi.fn().mockResolvedValue(true),
  R2_PUBLIC_URL: "https://r2.vortexpages.online",
}));

describe("Template Thumbnail R2", () => {
  it("should validate that template images are sent to R2", async () => {
    const { uploadImageToR2 } = await import("@/lib/r2");
    const buffer = Buffer.from("template-cover");
    const url = await uploadImageToR2("templates/test-123.webp", buffer, "image/webp");
    expect(url).toContain("https://r2.vortexpages.online/templates/test-123.webp");
  });
});
```

- [ ] **Step 2: Atualizar `publishTemplateAction` em `src/app/admin/templates/actions.ts`**
  - Aceitar `formData: FormData` ou `thumbnailFile?: File`.
  - Validar mimeType (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) e tamanho (<=5MB).
  - Fazer upload para `templates/${slug}-${Date.now()}.${ext}` no R2.
  - Passar `thumbnailUrl` para `publishTemplate(...)`.

- [ ] **Step 3: Atualizar `saveTemplateEditAction` e `deleteTemplateAction`**
  - Em `saveTemplateEditAction`: se enviado novo arquivo de thumbnail, subir no R2 e deletar o anterior.
  - Em `deleteTemplateAction`: se o template possuir `thumbnailUrl` do R2, remover do R2 via `deleteFileFromR2`.

- [ ] **Step 4: Atualizar UI dos modais (`publish-modal.tsx` e `edit-template-modal.tsx`)**
  - Adicionar input de arquivo com botão visual, preview de imagem da thumbnail e validação básica.
  - Enviar o arquivo no `publishTemplateAction` e `saveTemplateEditAction`.

- [ ] **Step 5: Rodar teste unitário**

Run: `npx vitest run src/tests/template-thumbnail-r2.test.ts`
Expected: PASS

---

### Task 4: Bateria de Testes e Validação Completa (Quality Gate)

- [ ] **Step 1: Rodar todos os testes unitários**
Run: `npm test`
Expected: PASS sem regressões.

- [ ] **Step 2: Typecheck do TypeScript**
Run: `npx tsc --noEmit`
Expected: 0 erros de tipagem.

- [ ] **Step 3: Linter**
Run: `npm run lint`
Expected: 0 novos erros ou warnings.

- [ ] **Step 4: Git Commit com mensagem descritiva**
Run: `git commit -m "feat(storage): migrate avatar and template images to cloudflare r2"`
