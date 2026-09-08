import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Determina se um endereço IPv4 ou IPv6 pertence a redes privadas, reservadas ou de loopback.
 * Bloqueia:
 * - 127.0.0.0/8 (Loopback)
 * - 10.0.0.0/8 (RFC 1918)
 * - 172.16.0.0/12 (RFC 1918)
 * - 192.168.0.0/16 (RFC 1918)
 * - 169.254.0.0/16 (Link-local / AWS / GCP / Cloudflare metadata: 169.254.169.254)
 * - 0.0.0.0/8
 * - 100.64.0.0/10 (Carrier-Grade NAT)
 * - ::1 (IPv6 Loopback)
 * - fc00::/7 (IPv6 Unique Local)
 * - fe80::/10 (IPv6 Link-Local)
 */
export function isPrivateIp(ip: string): boolean {
  const version = isIP(ip);
  if (!version) return true; // Se não for IP válido reconhecido, tratar como inseguro

  if (version === 4) {
    const parts = ip.split(".").map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some(isNaN)) return true;

    const [a, b] = parts;

    // 0.0.0.0/8
    if (a === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (Privado)
    if (a === 10) return true;
    // 172.16.0.0/12 (Privado: 172.16.0.0 - 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (Privado)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link-local / Cloud metadata)
    if (a === 169 && b === 254) return true;
    // 100.64.0.0/10 (CGNAT: 100.64.0.0 - 100.127.255.255)
    if (a === 100 && b >= 64 && b <= 127) return true;

    return false;
  }

  if (version === 6) {
    const normalized = ip.toLowerCase();
    // Loopback
    if (normalized === "::1" || normalized === "0000:0000:0000:0000:0000:0000:0000:0001") return true;
    // Unspecified
    if (normalized === "::" || normalized === "0000:0000:0000:0000:0000:0000:0000:0000") return true;
    // Unique Local Address (fc00::/7 -> fc.. ou fd..)
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    // Link-Local (fe80::/10 -> fe8, fe9, fea, feb)
    if (/^fe[89ab]/i.test(normalized)) return true;

    return false;
  }

  return true;
}

/**
 * Valida se uma URL pública é segura para requisições de saída (fetch no worker ou background).
 * Protege contra Server-Side Request Forgery (SSRF) e Cloud Metadata Exfiltration.
 */
export async function isSafePublicUrl(urlStr: string): Promise<boolean> {
  if (!urlStr || typeof urlStr !== "string") return false;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlStr);
  } catch {
    return false;
  }

  // Permitir apenas http e https
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return false;
  }

  const hostname = parsedUrl.hostname.toLowerCase().trim();
  if (!hostname) return false;

  // Bloquear hostnames comuns de loopback e nuvem
  if (
    hostname === "localhost" ||
    hostname === "local" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return false;
  }

  // Se o hostname já for um IP direto:
  if (isIP(hostname)) {
    return !isPrivateIp(hostname);
  }

  // Resolver DNS e verificar se aponta para IPs privados (bloqueia DNS rebinding e domínios maliciosos)
  try {
    const addresses = await lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) return false;

    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        return false;
      }
    }

    return true;
  } catch {
    // Se a resolução de DNS falhar, URL inacessível/insegura
    return false;
  }
}
