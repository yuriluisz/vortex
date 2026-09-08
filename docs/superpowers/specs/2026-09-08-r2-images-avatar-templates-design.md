# Especificação Técnica: Migração de Imagens (Avatar e Templates) para Cloudflare R2

## 1. Contexto & Objetivo
Atualmente, o upload de foto de perfil (`User.avatarUrl`) converte o arquivo enviado em uma string Base64 (`data:image/...;base64,...`) gravada diretamente no PostgreSQL, o que infla o banco de dados e degrada a performance de consultas. Além disso, os templates da comunidade (`Template.thumbnailUrl`) não possuem interface ou fluxo de upload de imagens, dependendo de um fallback estático `/community-template-icon.png`.

O objetivo desta especificação é unificar o armazenamento de imagens no **Cloudflare R2**, aproveitando o cliente S3 nativo já configurado em `src/lib/r2.ts`, mantendo a filosofia **Ponytail** (simplicidade, código mínimo, zero dependências desnecessárias).

## 2. Escopo Definido
- **Dentro do escopo:**
  1. Upload e remoção de fotos de perfil de usuários (`User.avatarUrl`) para Cloudflare R2 (`avatars/...`).
  2. Upload e atualização de imagens de capa/thumbnails de templates comunitários (`Template.thumbnailUrl`) para Cloudflare R2 (`templates/...`).
  3. Exclusão de arquivos órfãos no R2 quando o avatar ou template for substituído ou removido.
- **Fora do escopo (YAGNI):**
  - Campos de texto URL existentes em Campanhas (OG Image, Favicon, Imagem do Grupo WhatsApp) — mantidos intactos como URLs.
  - Redimensionamento dinâmico no servidor (Sharp/canvas) — dispensável para o MVP, validação de tamanho máximo de 5MB já atende com folga.

## 3. Arquitetura & Fluxo de Dados

### 3.1 Camada de Armazenamento R2 (`src/lib/r2.ts`)
Adição de funções utilitárias:
- `uploadImageToR2(key: string, buffer: Buffer, contentType: string): Promise<string>`
  - Executa `PutObjectCommand` com `Bucket: R2_BUCKET`, `Key: key`, `Body: buffer`, `ContentType: contentType`, `CacheControl: "public, max-age=31536000, immutable"`.
  - Retorna `${R2_PUBLIC_URL}/${key}`.
- `deleteFileFromR2(keyOrUrl: string): Promise<boolean>`
  - Extrai a chave se for passada uma URL completa que comece com `R2_PUBLIC_URL`.
  - Executa `DeleteObjectCommand` com tratamento de erro silencioso/logado.

### 3.2 Fluxo de Avatar (`src/app/admin/settings/profile-actions.ts`)
- **Upload (`uploadAvatarAction`):**
  1. Autenticação do usuário via `requireAuth()`.
  2. Validação do arquivo: tamanho <= 5MB, mime types permitidos (`image/jpeg`, `image/png`, `image/webp`, `image/gif`).
  3. Leitura do arquivo para `Buffer`.
  4. Geração de chave única: `avatars/${userId}-${Date.now()}.${ext}`.
  5. Se o usuário já possuía avatar no R2, aciona `deleteFileFromR2(user.avatarUrl)`.
  6. Envia o buffer via `uploadImageToR2(...)` e recebe a URL pública.
  7. Atualiza `prisma.user.update({ where: { id: userId }, data: { avatarUrl: publicUrl } })`.
  8. Registra audit log e revalida `/admin/settings`.
- **Remoção (`removeAvatarAction`):**
  1. Se `user.avatarUrl` for uma URL do R2, remove do bucket via `deleteFileFromR2`.
  2. Atualiza `User.avatarUrl = null`.

### 3.3 Fluxo de Templates (`src/app/admin/templates`)
- **Publicação de Template (`PublishModal` + `publishTemplateAction`):**
  1. Adiciona input de arquivo de capa/thumbnail no modal de publicação com preview instantâneo no cliente.
  2. No backend, se fornecido arquivo de thumbnail (validado até 5MB, tipos suportados), faz upload para `templates/${slug}-${Date.now()}.${ext}`.
  3. Grava a URL gerada em `Template.thumbnailUrl`.
- **Edição de Template (`EditTemplateModal` + `saveTemplateEditAction`):**
  1. Permite carregar uma nova imagem de capa.
  2. Ao salvar nova imagem, remove a anterior do R2 (se existente) e atualiza `Template.thumbnailUrl`.
- **Exclusão de Template (`deleteTemplateAction`):**
  1. Caso o template seja deletado e contenha `thumbnailUrl` no R2, remove o arquivo do bucket.

## 4. Segurança & Limites
- Validação estrita de extensão e MIME types no servidor.
- Limite rígido de 5MB por arquivo.
- Acesso público a arquivos via `R2_PUBLIC_URL` sem exposição de credenciais privadas.
- Sanitização de slugs e chaves S3 para evitar path traversal.

## 5. Plano de Verificação
- Teste unitário/integração com Vitest cobrindo:
  - `uploadImageToR2` e `deleteFileFromR2` (mock do S3Client).
  - `uploadAvatarAction` validando chamada correta ao R2 e gravação no banco.
  - `removeAvatarAction` validando limpeza no R2 e banco.
- Typecheck (`npx tsc --noEmit`) e Lint (`npm run lint`).
