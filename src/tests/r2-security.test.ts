import { describe, it, expect } from "vitest";
import { sanitizeR2Key } from "@/lib/r2";

describe("R2 Storage Security & Key Sanitization", () => {
  it("should accept valid alphanumeric and path keys", () => {
    expect(sanitizeR2Key("avatars/user-123_456.png")).toBe("avatars/user-123_456.png");
    expect(sanitizeR2Key("templates/my-template-123.webp")).toBe("templates/my-template-123.webp");
    expect(sanitizeR2Key("replays/camp123/sess456.json.gz")).toBe("replays/camp123/sess456.json.gz");
  });

  it("should reject path traversal using ../", () => {
    expect(() => sanitizeR2Key("../secret.txt")).toThrow("path traversal");
    expect(() => sanitizeR2Key("avatars/../../etc/passwd")).toThrow("path traversal");
    expect(() => sanitizeR2Key("replays/camp/..")).toThrow("path traversal");
  });

  it("should reject windows backslash traversal", () => {
    expect(() => sanitizeR2Key("avatars\\test.png")).toThrow("path traversal");
    expect(() => sanitizeR2Key("..\\..\\windows\\system32")).toThrow("path traversal");
  });

  it("should reject leading slashes", () => {
    expect(() => sanitizeR2Key("/avatars/pic.jpg")).toThrow("path traversal");
  });

  it("should reject illegal or dangerous characters", () => {
    expect(() => sanitizeR2Key("avatars/pic<script>.jpg")).toThrow("caracteres não permitidos");
    expect(() => sanitizeR2Key("avatars/pic|rm -rf.jpg")).toThrow("caracteres não permitidos");
    expect(() => sanitizeR2Key("avatars/pic;echo.jpg")).toThrow("caracteres não permitidos");
    expect(() => sanitizeR2Key("avatars/pic`id`.jpg")).toThrow("caracteres não permitidos");
  });

  it("should reject empty or nullish values", () => {
    expect(() => sanitizeR2Key("")).toThrow("inválida");
    // @ts-expect-error test invalid type
    expect(() => sanitizeR2Key(null)).toThrow("inválida");
    // @ts-expect-error test invalid type
    expect(() => sanitizeR2Key(undefined)).toThrow("inválida");
  });
});
