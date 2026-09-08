import { describe, it, expect } from "vitest";
import { isPrivateIp, isSafePublicUrl } from "@/lib/ssrf-guard";

describe("SSRF Protection Guard", () => {
  describe("isPrivateIp", () => {
    it("should identify IPv4 loopback as private", () => {
      expect(isPrivateIp("127.0.0.1")).toBe(true);
      expect(isPrivateIp("127.1.2.3")).toBe(true);
    });

    it("should identify RFC 1918 private ranges as private", () => {
      expect(isPrivateIp("10.0.0.1")).toBe(true);
      expect(isPrivateIp("10.255.255.255")).toBe(true);
      expect(isPrivateIp("172.16.0.1")).toBe(true);
      expect(isPrivateIp("172.31.255.255")).toBe(true);
      expect(isPrivateIp("192.168.1.1")).toBe(true);
    });

    it("should identify cloud metadata IP 169.254.169.254 as private", () => {
      expect(isPrivateIp("169.254.169.254")).toBe(true);
      expect(isPrivateIp("169.254.0.1")).toBe(true);
    });

    it("should identify IPv6 loopback and private ranges as private", () => {
      expect(isPrivateIp("::1")).toBe(true);
      expect(isPrivateIp("fc00::1")).toBe(true);
      expect(isPrivateIp("fe80::1")).toBe(true);
    });

    it("should recognize public IPv4 addresses as non-private", () => {
      expect(isPrivateIp("1.1.1.1")).toBe(false);
      expect(isPrivateIp("8.8.8.8")).toBe(false);
      expect(isPrivateIp("104.21.5.12")).toBe(false);
    });
  });

  describe("isSafePublicUrl", () => {
    it("should reject non-http/https schemes", async () => {
      expect(await isSafePublicUrl("file:///etc/passwd")).toBe(false);
      expect(await isSafePublicUrl("ftp://example.com/file")).toBe(false);
      expect(await isSafePublicUrl("javascript:alert(1)")).toBe(false);
      expect(await isSafePublicUrl("data:text/html,evil")).toBe(false);
    });

    it("should reject localhost and internal hostnames", async () => {
      expect(await isSafePublicUrl("http://localhost:3000/api")).toBe(false);
      expect(await isSafePublicUrl("http://myhost.local/")).toBe(false);
      expect(await isSafePublicUrl("http://service.internal/secret")).toBe(false);
    });

    it("should reject direct private IP URLs", async () => {
      expect(await isSafePublicUrl("http://127.0.0.1/admin")).toBe(false);
      expect(await isSafePublicUrl("http://169.254.169.254/latest/meta-data/")).toBe(false);
      expect(await isSafePublicUrl("http://192.168.0.1/router")).toBe(false);
      expect(await isSafePublicUrl("http://10.0.0.10/database")).toBe(false);
    });

    it("should accept valid public URLs", async () => {
      expect(await isSafePublicUrl("https://cloudflare.com/favicon.ico")).toBe(true);
      expect(await isSafePublicUrl("https://1.1.1.1/dns-query")).toBe(true);
    });
  });
});
