import { describe, it, expect, vi, beforeEach } from "vitest";
import { sanitizeFilename } from "@/lib/asset-resolver";
import {
  uploadTenantAssetAction,
  listTenantAssetsAction,
  deleteTenantAssetAction,
} from "@/app/admin/assets/actions";

// Mock das dependências externas
const mockSession = {
  userId: "user-1",
  email: "admin@vortex.test",
  tenantId: "tenant-1",
  role: "ADMIN",
};

vi.mock("@/lib/session", () => ({
  getSession: vi.fn().mockImplementation(() => Promise.resolve(mockSession)),
}));

const mockTenantFindUnique = vi.fn();
const mockTenantAssetFindMany = vi.fn();
const mockTenantAssetFindUnique = vi.fn();
const mockTenantAssetUpsert = vi.fn();
const mockTenantAssetDelete = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    tenant: {
      findUnique: (...args: unknown[]) => mockTenantFindUnique(...args),
    },
    tenantAsset: {
      findMany: (...args: unknown[]) => mockTenantAssetFindMany(...args),
      findUnique: (...args: unknown[]) => mockTenantAssetFindUnique(...args),
      upsert: (...args: unknown[]) => mockTenantAssetUpsert(...args),
      delete: (...args: unknown[]) => mockTenantAssetDelete(...args),
    },
  },
}));

const mockUploadImageToR2 = vi.fn();
const mockDeleteFileFromR2 = vi.fn();

vi.mock("@/lib/r2", () => ({
  uploadImageToR2: (...args: unknown[]) => mockUploadImageToR2(...args),
  deleteFileFromR2: (...args: unknown[]) => mockDeleteFileFromR2(...args),
}));

describe("sanitizeFilename", () => {
  it("sanitiza nomes válidos preservando extensão", () => {
    expect(sanitizeFilename("header-img.png")).toBe("header-img.png");
    expect(sanitizeFilename("banner_2026.webp")).toBe("banner_2026.webp");
    expect(sanitizeFilename("photo.JPG")).toBe("photo.JPG");
  });

  it("remove diretórios e previne path traversal", () => {
    expect(sanitizeFilename("../../etc/passwd/image.png")).toBe("image.png");
    expect(sanitizeFilename("..\\..\\windows\\logo.webp")).toBe("logo.webp");
    expect(sanitizeFilename("/var/www/assets/icon.svg")).toBe("icon.svg");
  });

  it("substitui caracteres especiais e espaços por underscore", () => {
    expect(sanitizeFilename("meu banner (1) & novo.png")).toBe("meu_banner__1____novo.png");
  });

  it("rejeita extensões inválidas", () => {
    expect(() => sanitizeFilename("malicious.exe")).toThrow();
    expect(() => sanitizeFilename("script.js")).toThrow();
    expect(() => sanitizeFilename("document.pdf")).toThrow();
    expect(() => sanitizeFilename(".env")).toThrow();
  });
});

describe("uploadTenantAssetAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTenantFindUnique.mockResolvedValue({ id: "tenant-1", active: true });
  });

  it("rejeita requisições sem arquivo", async () => {
    const formData = new FormData();
    const result = await uploadTenantAssetAction(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Nenhum arquivo");
  });

  it("rejeita tipos MIME não suportados", async () => {
    const formData = new FormData();
    const fakeFile = new File(["dummy"], "file.pdf", { type: "application/pdf" });
    formData.append("file", fakeFile);

    const result = await uploadTenantAssetAction(formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("não permitido");
  });

  it("faz upload de imagem válida e persiste no banco via upsert", async () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    const file = new File([pngHeader], "logo.png", { type: "image/png" });
    const formData = new FormData();
    formData.append("file", file);

    mockUploadImageToR2.mockResolvedValue("https://r2.vortexpages.online/assets/tenant-1/logo.png");
    mockTenantAssetUpsert.mockResolvedValue({
      id: "asset-123",
      tenantId: "tenant-1",
      filename: "logo.png",
      key: "assets/tenant-1/logo.png",
      url: "https://r2.vortexpages.online/assets/tenant-1/logo.png",
      mimeType: "image/png",
      size: pngHeader.length,
      createdAt: new Date(),
    });

    const result = await uploadTenantAssetAction(formData);
    expect(result.success).toBe(true);
    expect(result.asset?.filename).toBe("logo.png");
    expect(mockUploadImageToR2).toHaveBeenCalledWith(
      "assets/tenant-1/logo.png",
      expect.any(Buffer),
      "image/png"
    );
    expect(mockTenantAssetUpsert).toHaveBeenCalled();
  });
});

describe("listTenantAssetsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTenantFindUnique.mockResolvedValue({ id: "tenant-1", active: true });
  });

  it("lista os assets do tenant em ordem decrescente", async () => {
    mockTenantAssetFindMany.mockResolvedValue([
      {
        id: "a1",
        tenantId: "tenant-1",
        filename: "first.png",
        key: "assets/tenant-1/first.png",
        url: "https://r2.../first.png",
        mimeType: "image/png",
        size: 1024,
        createdAt: new Date(),
      },
    ]);

    const result = await listTenantAssetsAction();
    expect(result.success).toBe(true);
    expect(result.assets).toHaveLength(1);
    expect(mockTenantAssetFindMany).toHaveBeenCalledWith({
      where: { tenantId: "tenant-1" },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("deleteTenantAssetAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTenantFindUnique.mockResolvedValue({ id: "tenant-1", active: true });
  });

  it("impede exclusão de asset de outro tenant", async () => {
    mockTenantAssetFindUnique.mockResolvedValue({
      id: "a0000000-0000-0000-0000-000000000001",
      tenantId: "other-tenant",
      key: "assets/other-tenant/test.png",
    });

    const result = await deleteTenantAssetAction("a0000000-0000-0000-0000-000000000001");
    expect(result.success).toBe(false);
    expect(result.error).toContain("não pertence a este tenant");
    expect(mockDeleteFileFromR2).not.toHaveBeenCalled();
    expect(mockTenantAssetDelete).not.toHaveBeenCalled();
  });

  it("deleta asset com sucesso do R2 e do banco", async () => {
    mockTenantAssetFindUnique.mockResolvedValue({
      id: "a0000000-0000-0000-0000-000000000001",
      tenantId: "tenant-1",
      key: "assets/tenant-1/test.png",
    });

    const result = await deleteTenantAssetAction("a0000000-0000-0000-0000-000000000001");
    expect(result.success).toBe(true);
    expect(mockDeleteFileFromR2).toHaveBeenCalledWith("assets/tenant-1/test.png");
    expect(mockTenantAssetDelete).toHaveBeenCalledWith({
      where: { id: "a0000000-0000-0000-0000-000000000001" },
    });
  });
});
