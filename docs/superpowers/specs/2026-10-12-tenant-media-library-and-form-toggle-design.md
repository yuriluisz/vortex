# Design Spec: Tenant Media Library (R2) & Campaign Form Toggle

**Data:** 12 de Outubro de 2026  
**Autor:** Maestro & Equipe Vortex  
**Status:** Em Revisão (Brainstorming & Design)  
**Disciplinas:** `/brainstorming`, `/impeccable`, `/ponytail`, `/ponytail-audit`, `/maestri`

---

## 1. Visão Geral & Objetivos

### Problema 1: Dependência de CDNs externas para imagens de páginas
Atualmente, criadores de landing pages e templates na Vortex precisam hospedar imagens estruturais (logos, mockups, banners de fundo) em serviços externos de terceiros (ImgBB, Cloudinary, Imgur, AWS S3 próprio) ou usar URLs instáveis. Isso quebra páginas, atrasa a validação e gera atrito no onboarding.

### Problema 2: Formulários obrigatórios em páginas de navegação direta
Nem toda campanha de tráfego direto ou validação exige formulário de captura de leads. Páginas de "Hub de Links" (estilo Linktree/Bio), páginas de vendas diretas para checkout ou pontes para WhatsApp não necessitam de formulário de captura. Hoje, a estrutura força ou induz a presença do form, atrapalhando a experiência e gerando ruído visual.

### Soluções Propostas
1. **Biblioteca Unificada de Mídias do Tenant no Cloudflare R2:**  
   - Armazenamento centralizado por conta/tenant (reutilizável entre todas as campanhas do cliente).
   - Upload de formatos padrão web (`.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`, `.ico`).
   - **Asset Resolver Automático:** O cliente referencia no HTML apenas o nome do arquivo (ex: `<img src="header-img.png">` ou `url('banner.webp')`) e o renderizador da Vortex traduz automaticamente para a URL pública e otimizada no R2.
   - Zero custo de egress graças ao Cloudflare R2.
2. **Toggle de Desativação de Formulário (`formEnabled`):**  
   - Um interruptor simples e direto no painel da campanha.
   - Quando desativado, o placeholder `{{FORM_SLOT}}` e formulários customizados são completamente suprimidos sem quebrar o layout.

---

## 2. Modelagem de Dados (Prisma)

### Novo Modelo: `TenantAsset`
```prisma
model TenantAsset {
  id        String   @id @default(uuid())
  tenantId  String
  filename  String   // Nome limpo original, ex: "header-img.png"
  key       String   // Caminho no R2, ex: "assets/{tenantId}/{filename}"
  url       String   // URL pública completa, ex: "https://r2.vortexpages.online/assets/{tenantId}/{filename}"
  mimeType  String   // "image/png", "image/webp", etc.
  size      Int      // Tamanho em bytes
  createdAt DateTime @default(now())

  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, filename])
  @@index([tenantId])
}
```

### Atualização no Modelo: `Campaign`
```prisma
model Campaign {
  // ... campos existentes ...
  formEnabled Boolean @default(true) // Se false, oculta qualquer formulário e {{FORM_SLOT}}
}
```

---

## 3. Arquitetura de Armazenamento & Asset Resolver (Ponytail Philosophy)

### Filosofia Ponytail (Simplicidade Extrema & Zero Bloat):
- Não criar microsserviços nem proxies complexos.
- Aproveitar [`src/lib/r2.ts`](file:///src/lib/r2.ts) já existente com o client S3.
- R2 Key estruturada e segura:
  `assets/${tenantId}/${sanitizeFilename(filename)}`
- **Validação estrita:** Apenas MIME types de imagem válidos (`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`, `image/x-icon`). SVGs passam por sanitização prévia contra scripts maliciosos.

### O Mecanismo do Asset Resolver:
Em [`src/lib/asset-resolver.ts`](file:///src/lib/asset-resolver.ts):
Uma função pura, testável e ultra-rápida em uma única passada de regex:

```typescript
export function resolveTenantAssets(
  html: string,
  assetMap: Map<string, string> // Map<lowercase_filename, r2_url>
): string {
  if (!html || assetMap.size === 0) return html;

  // Encontra referências relativas a imagens em src, href, url() e srcset
  return html.replace(
    /((?:src|href)=["']|url\(['"]?|srcset=["'])(?:\.\/|\/)?([^"'#?)]+\.(?:png|jpe?g|webp|svg|ico))(['"\)])/gi,
    (match, prefix, filename, suffix) => {
      const lower = filename.toLowerCase();
      const r2Url = assetMap.get(lower);
      return r2Url ? `${prefix}${r2Url}${suffix}` : match;
    }
  );
}
```

---

## 4. Design de Interface & Experiência (Impeccable Standard)

### A. Gaveta/Modal de Biblioteca de Mídias (`MediaLibraryModal.tsx`):
- **Localização:** Botão com ícone de imagem (`ImageIcon`) na barra superior do `CampaignEditor`.
- **Área de Drop:** Drag-and-drop intuitivo com feedback de hover e preview de progresso de upload.
- **Grid de Assets:**
  - Thumbnails com aspect-ratio quadrado e background quadriculado sutil para transparências.
  - Nome do arquivo truncado com tooltip.
  - Badges compactas: formato (`PNG`, `WEBP`) e tamanho formatado (`142 KB`).
  - Ações rápidas em hover:
    - 📋 **Copiar Nome:** Copia `header-img.png` (para uso rápido no HTML).
    - 🔗 **Copiar URL R2:** Copia o link direto para quem quiser colar a URL completa.
    - 🗑️ **Excluir:** Remove do R2 e do banco de dados com modal de confirmação.
- **Filtro & Busca:** Campo de busca rápida por nome de arquivo em tempo real.

### B. Toggle de Formulário na Campanha (`CampaignSettingsModal.tsx`):
- Localizado na aba **"Formulário"** ou **"Geral"**:
  - Switch acessível com label em destaque: **"Habilitar Formulário de Captura"**.
  - Microcopy contextual (Impeccable): *"Quando desativado, o formulário e a tag `{{FORM_SLOT}}` ficam ocultos. Ideal para páginas de vendas diretas, páginas ponte e Hub de Links."*
  - Se desativado, desabilita visualmente a edição dos campos de formulário para evitar confusão mental.

### C. Renderização em `HtmlRenderer.tsx`:
- Se `formEnabled === false`:
  - Suprime a tag `{{FORM_SLOT}}` silenciosamente: `sanitized.replace(/\{\{\s*FORM_SLOT\s*\}\}/gi, "")`.
  - Formulários customizados com `data-vortex-custom-form` ou `<form>` são interceptados e não renderizados.

---

## 5. Divisão de Trabalho no Maestri (Multi-Agent Orchestration)

| Agente | Papel | Responsabilidades |
| :--- | :--- | :--- |
| **Maestro** (Você) | Orquestrador & Arquiteto | Conduzir o design, validar os checkpoints e sincronizar o `VORTEX_BOARD`. |
| **Vortex-Back** | Backend Engineer | 1. Schema Prisma (`TenantAsset` + `Campaign.formEnabled`) & migração.<br>2. Server Actions para upload, listagem e exclusão de assets no R2.<br>3. Utilitário `resolveTenantAssets` com testes unitários.<br>4. Injeção de assets nas rotas de renderização (`/[slug]` e previews). |
| **Vortex-Front** | Frontend Architect | 1. Componente `MediaLibraryModal` no `CampaignEditor` com padrão Impeccable.<br>2. Toggle `formEnabled` no `CampaignSettingsModal`.<br>3. Ajustes no `HtmlRenderer.tsx` para suprimir form quando desabilitado. |
| **Vortex-Tester** | Security & QA | 1. Testes de segurança: Path traversal, mime-type spoofing, SVG XSS via R2.<br>2. Testes de regressão do `HtmlRenderer` com e sem formulário.<br>3. Execução dos 4 Quality Gates (Typecheck, Lint, Vitest, Build). |

---

## 6. Próximos Passos
1. Obter aprovação do usuário sobre este design.
2. Atualizar nota `VORTEX_BOARD` com o roadmap da sprint.
3. Despachar as tarefas específicas para `Vortex-Back`, `Vortex-Front` e `Vortex-Tester` via `maestri ask`.
