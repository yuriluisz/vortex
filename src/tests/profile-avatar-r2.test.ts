process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.RESEND_API_KEY = "re_test_key";

import { describe, it, expect, vi, beforeEach } from "vitest";

const uploadImageToR2Mock = vi.fn().mockResolvedValue("https://r2.vortexpages.online/avatars/user-1-12345.png");
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
  }),
}));

const userFindUniqueMock = vi.fn().mockResolvedValue({
  id: "user-1",
  avatarUrl: "https://r2.vortexpages.online/avatars/old-avatar.png",
});
const userUpdateMock = vi.fn().mockResolvedValue({ id: "user-1" });

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => userFindUniqueMock(...args),
      update: (...args: unknown[]) => userUpdateMock(...args),
    },
    tenant: {
      findUnique: vi.fn().mockResolvedValue({ id: "tenant-1", plan: "PRO" }),
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

  it("should upload avatar to R2, delete old R2 file, and update database", async () => {
    const { uploadAvatarAction } = await import("@/app/admin/settings/profile-actions");

    const formData = new FormData();
    const file = new File(["fake-image-bytes"], "avatar.png", { type: "image/png" });
    formData.append("avatar", file);

    const result = await uploadAvatarAction(undefined, formData);

    expect(result.success).toBe(true);
    expect(result.avatarUrl).toBe("https://r2.vortexpages.online/avatars/user-1-12345.png");
    expect(uploadImageToR2Mock).toHaveBeenCalledTimes(1);
    expect(deleteFileFromR2Mock).toHaveBeenCalledWith("https://r2.vortexpages.online/avatars/old-avatar.png");
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { avatarUrl: "https://r2.vortexpages.online/avatars/user-1-12345.png" },
    });
  });

  it("should delete old file from R2 when removing avatar", async () => {
    const { removeAvatarAction } = await import("@/app/admin/settings/profile-actions");

    const result = await removeAvatarAction();

    expect(result?.success).toBe(true);
    expect(deleteFileFromR2Mock).toHaveBeenCalledWith("https://r2.vortexpages.online/avatars/old-avatar.png");
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { avatarUrl: null },
    });
  });
});
