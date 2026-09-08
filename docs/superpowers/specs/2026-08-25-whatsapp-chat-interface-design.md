# Design Spec: WhatsApp Web-Style Central Console

**Date:** 2026-08-25  
**Topic:** WhatsApp Central 3-Column Split Interface (Campaigns, Live Chat Feed, Target Groups & Message Info)  
**Status:** Approved via Grill-me  

---

## 1. Vision & Architecture

Create a WhatsApp Web-inspired experience for the WhatsApp Ultra module (`/admin/whatsapp`), unifying broadcast dispatches and history tracking into an interactive chat interface:

1. **Header & Quick Navigation:**
   - WhatsApp instance connection status pill (`Conectado • +55...`).
   - Quick navigation tabs: **Central de Disparos** (Chat Web), **Logs Técnicos** (Tabela detalhada), e **Configurações & Conexão** (QR Code/Instância).
2. **Left Column (Campaigns List):**
   - Search input for campaigns.
   - Campaign items with avatar, name, group count badge, last dispatched message snippet, and timestamp.
3. **Center Column (Interactive Chat Feed & Composer):**
   - Active campaign header with group stats and sender phone.
   - Outgoing WhatsApp-style message bubbles with status checks (`✓✓`), dispatch timestamp, recipient group pill, and click-to-inspect delivery details.
   - Rich message composer at the bottom with target group selector switcher, multi-line input, and send button with shimmer/loading.
4. **Right Slide-over Panel (Dual Mode):**
   - **Mode A: Target Groups Selection:** Checkboxes, Select All toggle, group capacity pills, JID status.
   - **Mode B: Message Delivery Details:** Detailed breakdown of groups delivered (`OK`) vs failed (`FAILED`) with a single-click retry button for failed dispatches.

---

## 2. Affected Files

- `src/app/admin/whatsapp/page.tsx`
- `src/app/admin/whatsapp/layout.tsx`
- `src/app/admin/whatsapp/broadcast/page.tsx`
- `src/app/admin/whatsapp/broadcast/BroadcastForm.tsx` (Replaced by `WhatsAppChatConsole.tsx`)
- `src/components/admin/whatsapp-chat-console.tsx` [NEW]
- `src/components/admin/whatsapp-message-drawer.tsx` [NEW]
- `src/components/admin/whatsapp-tabs.tsx`
- `src/app/admin/whatsapp/actions.ts`

---

## 3. Verification Plan
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
