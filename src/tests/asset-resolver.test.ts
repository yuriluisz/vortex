import { describe, it, expect } from "vitest";
import { resolveTenantAssets } from "@/lib/asset-resolver";

describe("resolveTenantAssets", () => {
  const assetMap = new Map<string, string>([
    ["header-img.png", "https://r2.vortexpages.online/assets/tenant-1/header-img.png"],
    ["banner.webp", "https://r2.vortexpages.online/assets/tenant-1/banner.webp"],
    ["favicon.ico", "https://r2.vortexpages.online/assets/tenant-1/favicon.ico"],
    ["icon.svg", "https://r2.vortexpages.online/assets/tenant-1/icon.svg"],
    ["photo.jpg", "https://r2.vortexpages.online/assets/tenant-1/photo.jpg"],
  ]);

  it("retorna o HTML inalterado se for vazio ou se o assetMap estiver vazio", () => {
    expect(resolveTenantAssets("", assetMap)).toBe("");
    expect(resolveTenantAssets("<div>teste</div>", new Map())).toBe("<div>teste</div>");
  });

  it("substitui referências relativas em tags <img> (src)", () => {
    const input = `<img src="header-img.png" alt="Header" />`;
    const output = resolveTenantAssets(input, assetMap);
    expect(output).toBe(`<img src="https://r2.vortexpages.online/assets/tenant-1/header-img.png" alt="Header" />`);
  });

  it("substitui referências com prefixos ./ e /", () => {
    const input = `<img src="./header-img.png" /><img src="/banner.webp" />`;
    const output = resolveTenantAssets(input, assetMap);
    expect(output).toContain(`src="https://r2.vortexpages.online/assets/tenant-1/header-img.png"`);
    expect(output).toContain(`src="https://r2.vortexpages.online/assets/tenant-1/banner.webp"`);
  });

  it("substitui referências em regras CSS url()", () => {
    const input = `
      <div style="background-image: url('banner.webp');"></div>
      <div style="background: url(\"photo.jpg\");"></div>
      <style>.bg { background: url(icon.svg); }</style>
    `;
    const output = resolveTenantAssets(input, assetMap);
    expect(output).toContain(`url('https://r2.vortexpages.online/assets/tenant-1/banner.webp')`);
    expect(output).toContain(`url("https://r2.vortexpages.online/assets/tenant-1/photo.jpg")`);
    expect(output).toContain(`url(https://r2.vortexpages.online/assets/tenant-1/icon.svg)`);
  });

  it("substitui referências em tags <link> (href)", () => {
    const input = `<link rel="icon" href="favicon.ico" />`;
    const output = resolveTenantAssets(input, assetMap);
    expect(output).toBe(`<link rel="icon" href="https://r2.vortexpages.online/assets/tenant-1/favicon.ico" />`);
  });

  it("não altera URLs externas absolutas (http/https//)", () => {
    const input = `<img src="https://cdn.example.com/header-img.png" /><img src="//other.com/banner.webp" />`;
    const output = resolveTenantAssets(input, assetMap);
    expect(output).toBe(input);
  });

  it("realiza correspondência case-insensitive", () => {
    const input = `<img src="HEADER-IMG.PNG" />`;
    const output = resolveTenantAssets(input, assetMap);
    expect(output).toBe(`<img src="https://r2.vortexpages.online/assets/tenant-1/header-img.png" />`);
  });

  it("resolve referências com subdiretórios relativos pelo nome base", () => {
    const input = `<img src="assets/images/header-img.png" />`;
    const output = resolveTenantAssets(input, assetMap);
    expect(output).toBe(`<img src="https://r2.vortexpages.online/assets/tenant-1/header-img.png" />`);
  });

  it("mantém arquivos não mapeados inalterados", () => {
    const input = `<img src="unknown-image.png" />`;
    const output = resolveTenantAssets(input, assetMap);
    expect(output).toBe(input);
  });
});
