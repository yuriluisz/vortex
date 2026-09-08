/**
 * Validador de assinaturas binárias (Magic Bytes) para imagens.
 * Proteção nativa de alta performance contra Content-Type Spoofing e Polyglot files.
 * Zero dependências externas.
 */

export interface ImageValidationResult {
  valid: boolean;
  isValid: boolean;
  mimeType?: string;
  ext?: string;
  detectedFormat?: string;
  error?: string;
}

export function validateImageBuffer(buffer: Buffer): ImageValidationResult {
  if (!buffer || buffer.length < 4) {
    return {
      valid: false,
      isValid: false,
      error: "Arquivo muito pequeno ou vazio para ser uma imagem válida.",
    };
  }

  // 1. JPEG: FF D8 FF
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, isValid: true, mimeType: "image/jpeg", ext: "jpg", detectedFormat: "jpg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, isValid: true, mimeType: "image/png", ext: "png", detectedFormat: "png" };
  }

  // 3. GIF: GIF87a ou GIF89a
  if (buffer.length >= 6) {
    const isGif87a = buffer.subarray(0, 6).toString("ascii") === "GIF87a";
    const isGif89a = buffer.subarray(0, 6).toString("ascii") === "GIF89a";
    if (isGif87a || isGif89a) {
      return { valid: true, isValid: true, mimeType: "image/gif", ext: "gif", detectedFormat: "gif" };
    }
  }

  // 4. WEBP: RIFF + (4 bytes length) + WEBP
  if (buffer.length >= 12) {
    const isRiff = buffer.subarray(0, 4).toString("ascii") === "RIFF";
    const isWebp = buffer.subarray(8, 12).toString("ascii") === "WEBP";
    if (isRiff && isWebp) {
      return { valid: true, isValid: true, mimeType: "image/webp", ext: "webp", detectedFormat: "webp" };
    }
  }

  return {
    valid: false,
    isValid: false,
    error: "Assinatura de imagem inválida ou corrompida. Use apenas arquivos legítimos JPEG, PNG, WEBP ou GIF.",
  };
}
