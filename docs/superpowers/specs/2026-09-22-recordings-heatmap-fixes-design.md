# Design Spec: Correção dos Replays de Sessão e Mapa de Calor

**Data:** 2026-09-22  
**Projeto:** Vortex (`vortexpages.online`)  
**Módulos Afetados:**
- `src/components/admin/recordings/ReplayPlayerModal.tsx`
- `src/components/analytics/SessionTracker.tsx`
- `src/components/admin/recordings/HeatmapView.tsx`
- `src/app/api/analytics/recordings/ingest/route.ts`

---

## 1. Problemas Diagnosticados & Causa Raiz

1. **Modal de Replay posicionado fora de vista (lá embaixo ou no meio da lista):**
   - *Causa:* Renderização de elemento `position: fixed` dentro de ancestral com animações CSS (`animate-in fade-in`) e `overflow-y-auto`, criando um contêiner de posicionamento isolado.
   - *Solução:* Renderizar via `createPortal(..., document.body)`, bloquear o scroll do `body` com `overflow: hidden`, definir `z-[9999]` e fechar com tecla `ESC`.

2. **Duração informada de 70s mas gravação com apenas 1 segundo:**
   - *Causa:* O `SessionTracker` limpava a fila de eventos (`eventsQueue = []`) a cada flush. O backend no Cloudflare R2 sobrescrevia o arquivo `.json.gz` a cada requisição. O último envio (no segundo 69-70) continha apenas os eventos daquele último segundo e apagava todo o histórico anterior.
   - *Solução:* Manter os eventos acumulados da sessão na memória do cliente (`sessionEvents`) até um limite de 2.500 eventos ou 3MB, enviando a gravação completa a cada flush.

3. **Gravações com tela preta ou dimensões distorcidas:**
   - *Causa:* Ao sobrescrever o arquivo no R2 com apenas o último chunk, o evento de `FullSnapshot` (`type: 2`, capturado no t=0) era excluído. O player do `rrweb` não tinha o DOM da página para exibir. Além disso, o arquivo oficial `rrweb/dist/style.css` não estava sendo importado, deixando o contêiner do replayer e o cursor sem estilos CSS essenciais.
   - *Solução:* Com a retenção cumulativa, o `FullSnapshot` é sempre preservado. Importar explicitamente `rrweb/dist/style.css` no player.

4. **Mapa de calor impreciso e desalinhado com a estrutura da página:**
   - *Causa:* O `HeatmapView` usava uma função sintética (`buildPreviewDoc`) que injetava o Tailwind do CDN e um placeholder de formulário de 80px (enquanto na página real o formulário tem ~350px). A altura total (`docHeight`) e a tipografia divergiam radicalmente da página real, fazendo os cliques caírem em posições completamente descompassadas.
   - *Solução:* Remover o HTML falso. Fazer o iframe do Heatmap carregar a rota real da campanha (`/${campaignSlug}?preview=true`), garantindo que o DOM, CSS, formulários e fontes sejam 100% idênticos aos visualizados pelo lead.

---

## 2. Detalhamento das Alterações

### 2.1. `ReplayPlayerModal.tsx`
- Importar `createPortal` de `react-dom`.
- Importar `rrweb/dist/style.css`.
- Adicionar hook para travar o scroll do `body`:
  ```tsx
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);
  ```
- Retornar o JSX através de `createPortal(modalContent, document.body)`.

### 2.2. `SessionTracker.tsx`
- Substituir `eventsQueue = []` por histórico cumulativo `allEvents: unknown[]`.
- No evento `emit(event)`:
  - Adicionar ao `allEvents` se `allEvents.length < 2500`.
- No `flush()`:
  - Enviar `[...allEvents]`.
  - Não limpar `allEvents` (apenas `clicksQueue` é consumida pois os cliques do heatmap são inseridos por lote).

### 2.3. `HeatmapView.tsx`
- Simplificar o carregamento do preview para usar a URL real da campanha: `/${campaignSlug}?preview=true`.
- Garantir que o canvas térmico aguarde o carregamento completo do iframe antes de calcular as coordenadas e desenhar o gradiente de calor.

---

## 3. Plano de Testes & Verificação

1. Testes unitários do `verify-deploy` e testes existentes em `src/tests/` devem continuar passando 100%.
2. Testes de unidade do `HeatmapView` e `session-recordings` atualizados para cobrir o novo comportamento.
3. Verificação de renderização do portal no browser.
