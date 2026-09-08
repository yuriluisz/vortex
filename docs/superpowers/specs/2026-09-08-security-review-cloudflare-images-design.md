# Especificação de Design: Blindagem de Segurança (R2, Imagens, Rotas & Cloudflare)

## 1. Contexto & Diagnóstico
Esta especificação consolida os resultados da auditoria de segurança baseada no modelo STRIDE e nas diretrizes OWASP Top 10 (2025), cobrindo:
1. **Cloudflare R2 & Imagens:** Prevenção contra spoofing de tipo MIME (execução de scripts via SVG/HTML polyglots) e injeção de Path Traversal nas chaves S3.
2. **Abuso de Recursos & DoS:** Ausência de rate limiting nas Server Actions de upload de avatar e templates.
3. **SSRF (Server-Side Request Forgery):** Requisições externas cegas disparadas pelo Worker ao buscar `groupImageUrl`.
4. **Timing Attacks:** Comparação não constante de tokens de autenticação no webhook do Asaas.
5. **Zip Bombs:** Descompressão em memória sem teto de buffer em rotas de stream de replay.

## 2. Decisões Arquiteturais (Filosofia Ponytail)
- **Zero bibliotecas pesadas extras:** Utilização das APIs nativas do Node.js (`node:crypto`, `node:zlib`, `node:dns/promises`) e utilitários internos existentes (`@/lib/rate-limit`).
- **Validação em Profundidade:** Não confiar no cabeçalho `Content-Type` enviado pelo cliente; inspecionar os primeiros bytes (magic bytes) no servidor antes de autorizar qualquer envio ao R2.
- **Fail-Closed:** Qualquer chave R2 que contenha caracteres inválidos ou sequências `..` é sumariamente rejeitada com exceção.

## 3. Componentes & Especificação Técnica

### 3.1 Validação de Magic Bytes (`src/lib/image-validator.ts`)
- Suporte estrito a:
  - **JPEG:** `FF D8 FF`
  - **PNG:** `89 50 4E 47 0D 0A 1A 0A`
  - **WEBP:** `RIFF` + (4 bytes) + `WEBP`
  - **GIF:** `GIF87a` ou `GIF89a`
- Rejeição imediata de arquivos SVG, HTML, scripts ou executáveis disfarçados com extensão de imagem.

### 3.2 Sanitização de Chaves R2 (`src/lib/r2.ts`)
- Sanitizador `sanitizeR2Key(key: string)`:
  - Remove barras iniciais e espaços.
  - Rejeita qualquer tentativa de `..`, contra-barras `\` ou byte nulo `\0`.
  - Garante whitelist de caracteres: `^[a-zA-Z0-9_\-\./]+$`.

### 3.3 Guard SSRF para Requisições Externas (`src/lib/ssrf-guard.ts`)
- Função `isSafePublicUrl(urlStr: string): boolean`:
  - Protocolo deve ser estritamente `http:` ou `https:`.
  - Rejeita hostnames `localhost`, IPs de loopback (`127.0.0.0/8`, `::1`), IPs privados RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) e metadados de nuvem (`169.254.0.0/16`).
  - No Worker: timeout rígido de 5 segundos (`AbortSignal.timeout(5000)`) e teto de download de 5MB.

### 3.4 Rate Limiting em Uploads
- `uploadAvatarAction`: limite de 5 uploads por minuto por usuário autenticado.
- `publishTemplateAction`: limite de 10 uploads/publicações por minuto por tenant.

### 3.5 Constant-Time Comparison no Webhook do Asaas
- Utilizar `crypto.timingSafeEqual` com buffers de mesmo tamanho, idêntico à implementação segura da Evolution API.

### 3.6 Proteção contra Zip Bomb em Replays
- Em `stream/route.ts`, configurar `maxOutputLength: 20 * 1024 * 1024` (20MB) no `gunzipSync`.

## 4. Plano de Verificação
- Testes unitários dedicados em `src/tests/`:
  - `image-validator.test.ts`
  - `ssrf-guard.test.ts`
  - `r2-images.test.ts` (path traversal)
  - `upload-ratelimit.test.ts`
  - `asaas-webhook-security.test.ts`
- Bateria de testes `npm test`, typecheck estrito `npx tsc --noEmit` e linter `npm run lint`.
