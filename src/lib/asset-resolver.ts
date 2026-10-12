/**
 * Utilitário puro e de alta performance para resolução de referências a imagens.
 * Substitui caminhos relativos de imagens pelas URLs públicas do Cloudflare R2
 * cadastradas no TenantAsset do tenant correspondente.
 */

export function resolveTenantAssets(
  html: string,
  assetMap: Map<string, string> // Map<lowercase_filename, r2_url>
): string {
  if (!html || !assetMap || assetMap.size === 0) return html;

  // Encontra referências relativas a imagens em src, href, url() e srcset
  return html.replace(
    /((?:src|href)=["']|url\(['"]?|srcset=["'])(?!\/\/|https?:\/\/|data:)(?:\.\/|\/)?([^"'#?)]+\.(?:png|jpe?g|webp|svg|ico))(['"\)])/gi,
    (match, prefix, filename, suffix) => {
      // Ignora URLs absolutas externas ou com protocolo
      if (
        filename.startsWith("http://") ||
        filename.startsWith("https://") ||
        filename.startsWith("//") ||
        filename.startsWith("data:")
      ) {
        return match;
      }

      const lower = filename.toLowerCase();
      const basename = lower.split("/").pop() || lower;
      const r2Url = assetMap.get(lower) || assetMap.get(basename);

      return r2Url ? `${prefix}${r2Url}${suffix}` : match;
    }
  );
}

/**
 * Sanitiza o nome do arquivo para prevenir Directory/Path Traversal.
 * Remove caminhos de pastas, caracteres de controle e restringe extensões.
 */
export function sanitizeFilename(rawName: string): string {
  if (!rawName || typeof rawName !== "string") {
    throw new Error("Nome de arquivo inválido.");
  }

  // Remove qualquer prefixo de diretório (Windows e POSIX)
  const basename = rawName.replace(/^.*[\\/]/, "").trim();

  // Substitui caracteres inseguros por underscore
  const clean = basename.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Remove pontos iniciais (previne arquivos ocultos)
  const safeName = clean.replace(/^\.+/, "");

  if (!safeName || safeName.length === 0) {
    throw new Error("Nome de arquivo inválido após sanitização.");
  }

  const VALID_EXTENSIONS = /\.(png|jpe?g|webp|svg|ico)$/i;
  if (!VALID_EXTENSIONS.test(safeName)) {
    throw new Error("Extensão de imagem não permitida. Use PNG, JPEG, WEBP, SVG ou ICO.");
  }

  return safeName;
}

