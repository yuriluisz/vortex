import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
export const R2_BUCKET = process.env.R2_BUCKET_NAME || "vortex";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://r2.vortexpages.online";

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.warn("⚠️ Cloudflare R2 credentials not fully configured in environment.");
}

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || "",
    secretAccessKey: secretAccessKey || "",
  },
});

/**
 * Faz upload de um buffer de gravação (normalmente gzip) para o R2
 */
export async function uploadReplayPayload(
  key: string,
  buffer: Buffer,
  contentType: string = "application/gzip"
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ContentEncoding: contentType === "application/gzip" ? "gzip" : undefined,
    })
  );

  return key;
}

/**
 * Lê o stream/buffer de um replay gravado no R2
 */
export async function getReplayPayload(key: string): Promise<Buffer | null> {
  try {
    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );

    if (!response.Body) return null;
    const byteArray = await response.Body.transformToByteArray();
    return Buffer.from(byteArray);
  } catch (error) {
    console.error(`Erro ao buscar replay no R2 (${key}):`, error);
    return null;
  }
}

/**
 * Deleta um arquivo de replay do R2
 */
export async function deleteReplayPayload(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    console.error(`Erro ao deletar replay no R2 (${key}):`, error);
    return false;
  }
}

/**
 * Faz upload de uma imagem (buffer) para o R2 com cache público e retorna a URL pública completa.
 */
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

/**
 * Remove um arquivo do R2 recebendo a chave relativa ou a URL pública completa.
 * Retorna false sem estourar erro se a URL for Base64 ou externa.
 */
export async function deleteFileFromR2(keyOrUrl: string): Promise<boolean> {
  if (!keyOrUrl || keyOrUrl.startsWith("data:")) return false;

  let key = keyOrUrl;
  if (key.startsWith(R2_PUBLIC_URL)) {
    key = key.slice(R2_PUBLIC_URL.length).replace(/^\/+/, "");
  } else if (key.startsWith("http://") || key.startsWith("https://")) {
    return false; // URL externa não pertence ao nosso bucket R2
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
