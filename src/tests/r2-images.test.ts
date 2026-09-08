import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: vi.fn(function () {
      return { send: sendMock };
    }),
    PutObjectCommand: vi.fn(function (args) {
      return { ...args, _type: "PutObjectCommand" };
    }),
    DeleteObjectCommand: vi.fn(function (args) {
      return { ...args, _type: "DeleteObjectCommand" };
    }),
    GetObjectCommand: vi.fn(function (args) {
      return { ...args, _type: "GetObjectCommand" };
    }),
  };
});

describe("R2 Image Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upload image buffer to R2 and return public URL", async () => {
    sendMock.mockResolvedValueOnce({});
    const { uploadImageToR2, R2_PUBLIC_URL } = await import("@/lib/r2");
    const testBuffer = Buffer.from("fake-image");
    const key = "avatars/user-123-12345.png";
    const result = await uploadImageToR2(key, testBuffer, "image/png");

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(`${R2_PUBLIC_URL}/${key}`);
  });

  it("should delete file from R2 using key or public URL", async () => {
    sendMock.mockResolvedValue({});
    const { deleteFileFromR2, R2_PUBLIC_URL } = await import("@/lib/r2");
    const key = "avatars/user-123-12345.png";
    const fullUrl = `${R2_PUBLIC_URL}/${key}`;

    const res1 = await deleteFileFromR2(key);
    expect(res1).toBe(true);

    const res2 = await deleteFileFromR2(fullUrl);
    expect(res2).toBe(true);

    // Ignora URLs externas ou Base64 sem erro
    const res3 = await deleteFileFromR2("data:image/png;base64,123");
    expect(res3).toBe(false);

    const res4 = await deleteFileFromR2("https://images.unsplash.com/photo-123");
    expect(res4).toBe(false);
  });
});
