process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.RESEND_API_KEY = "re_test_key";

import { describe, it, expect, vi, beforeEach } from "vitest";

const uploadImageToR2Mock = vi.fn().mockResolvedValue("https://r2.vortexpages.online/templates/test-template-12345.png");
const deleteFileFromR2Mock = vi.fn().mockResolvedValue(true);

vi.mock("server-only", () => ({}));

vi.mock("@/lib/r2", () => ({
  uploadImageToR2: uploadImageToR2Mock,
  deleteFileFromR2: deleteFileFromR2Mock,
  R2_PUBLIC_URL: "https://r2.vortexpages.online",
}));

vi.mock("@/lib/session", () => ({
  getSession: vi.fn().mockResolvedValue({
    userId: "user-1",
    tenantId: "tenant-1",
    email: "test@example.com",
    role: "ADMIN",
    plan: "PRO",
  }),
}));

const publishTemplateMock = vi.fn().mockResolvedValue({ id: "tmpl-1" });
vi.mock("@/services/template.service", () => ({
  publishTemplate: (...args: unknown[]) => publishTemplateMock(...args),
  updateTemplateVersion: vi.fn(),
}));

const findFirstCampaignMock = vi.fn().mockResolvedValue({
  id: "camp-1",
  rawHtml: "<h1>Test</h1>",
  formSchema: {},
});

const templateFindUniqueMock = vi.fn().mockResolvedValue({
  id: "tmpl-1",
  authorId: "user-1",
  slug: "test-slug",
  thumbnailUrl: "https://r2.vortexpages.online/templates/old-cover.png",
  _count: { usages: 0 },
});

const templateDeleteMock = vi.fn().mockResolvedValue({ id: "tmpl-1" });

const templateUpdateMock = vi.fn().mockResolvedValue({ id: "tmpl-1" });

vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    campaign: {
      findFirst: (...args: unknown[]) => findFirstCampaignMock(...args),
    },
    template: {
      findUnique: (...args: unknown[]) => templateFindUniqueMock(...args),
      update: (...args: unknown[]) => templateUpdateMock(...args),
      delete: (...args: unknown[]) => templateDeleteMock(...args),
    },
    templateVersion: {
      findFirst: vi.fn().mockResolvedValue({ version: 1, rawHtml: "<h1>Test</h1>" }),
      create: vi.fn().mockResolvedValue({ id: "v-2" }),
    },
    $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

vi.mock("@/lib/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(true),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Template Thumbnail R2 Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upload template thumbnail to R2 and pass thumbnailUrl to publishTemplate", async () => {
    const { publishTemplateAction } = await import("@/app/admin/templates/actions");

    const formData = new FormData();
    formData.append("name", "Meu Template Pro");
    formData.append("description", "Descrição de teste");
    formData.append("category", "LANDING_PAGE");
    formData.append("theme", "DARK");
    formData.append("tags", "vendas, alta conversao");
    formData.append("sourceCampaignId", "camp-1");

    const file = new File(["fake-template-cover"], "cover.png", { type: "image/png" });
    formData.append("thumbnail", file);

    await publishTemplateAction(formData);

    expect(uploadImageToR2Mock).toHaveBeenCalledTimes(1);
    expect(publishTemplateMock).toHaveBeenCalledWith(
      "user-1",
      "tenant-1",
      expect.objectContaining({
        name: "Meu Template Pro",
        thumbnailUrl: "https://r2.vortexpages.online/templates/test-template-12345.png",
      })
    );
  });

  it("should delete thumbnail from R2 when template is deleted", async () => {
    const { deleteTemplateAction } = await import("@/app/admin/templates/actions");

    await deleteTemplateAction("tmpl-1");

    expect(deleteFileFromR2Mock).toHaveBeenCalledWith("https://r2.vortexpages.online/templates/old-cover.png");
    expect(templateDeleteMock).toHaveBeenCalledWith({ where: { id: "tmpl-1" } });
  });

  it("should update thumbnail in R2 and remove old one on saveTemplateEditAction", async () => {
    const { saveTemplateEditAction } = await import("@/app/admin/templates/actions");

    const formData = new FormData();
    formData.append("name", "Template Atualizado");
    formData.append("description", "Desc atualizada");
    formData.append("category", "LANDING_PAGE");
    formData.append("theme", "LIGHT");
    formData.append("tags", "novo");
    formData.append("rawHtml", "<h1>Novo HTML</h1><div>{{FORM_SLOT}}</div>");

    const newCover = new File(["new-cover-bytes"], "new-cover.png", { type: "image/png" });
    formData.append("thumbnail", newCover);

    await saveTemplateEditAction("tmpl-1", formData);

    expect(uploadImageToR2Mock).toHaveBeenCalled();
    expect(deleteFileFromR2Mock).toHaveBeenCalledWith("https://r2.vortexpages.online/templates/old-cover.png");
    expect(templateUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "tmpl-1" },
        data: expect.objectContaining({
          name: "Template Atualizado",
          thumbnailUrl: "https://r2.vortexpages.online/templates/test-template-12345.png",
        }),
      })
    );
  });
});
