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
    const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00]);
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

  it("should reject spoofed files (e.g. HTML or script with image extension)", () => {
    const fakeBuffer = Buffer.from("<script>alert('xss')</script>");
    const result = validateImageBuffer(fakeBuffer);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should reject tiny or empty buffers", () => {
    expect(validateImageBuffer(Buffer.from([])).valid).toBe(false);
    expect(validateImageBuffer(Buffer.from([0x01, 0x02])).valid).toBe(false);
  });
});
