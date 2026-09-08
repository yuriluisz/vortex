# WhatsApp Web-Style Central Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WhatsApp Web-inspired 3-column split interface for the Ultra WhatsApp module, unifying broadcast dispatches, live chat feed history, target group selector, and click-to-inspect message delivery details drawer.

**Architecture:** Client-side interactive 3-column layout (`WhatsAppChatConsole`), Server Action dispatches (`sendBroadcastAction`, `retryFailedGroupMessageAction`), resilient message history hydration per campaign, and responsive drawer support.

---

### Task 1: Add Retry Action & Fetch Queries in `src/app/admin/whatsapp/actions.ts`
- Add `retryFailedBroadcastAction` to re-send to failed groups.
- Ensure `getCampaignMessagesAction` returns message history with results per campaign.

### Task 2: Build `src/components/admin/whatsapp-chat-console.tsx`
- Left column: Searchable campaigns list with last message snippet, badge, and active state.
- Center column: Chat header, outgoing WhatsApp green bubbles with timestamp and `✓✓` checks, click-to-inspect handler, and message composer at the bottom.
- Right column / drawer: Toggle between target groups selection and message delivery details with retry button.

### Task 3: Update `src/app/admin/whatsapp/broadcast/page.tsx` & `src/components/admin/whatsapp-tabs.tsx`
- Pass campaigns, active groups, messages, and instance info to `WhatsAppChatConsole`.
- Polish WhatsApp layout and tabs.

### Task 4: Verification & Quality Gates
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
