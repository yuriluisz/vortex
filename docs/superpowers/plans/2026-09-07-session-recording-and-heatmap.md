# Session Recording & Heatmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement lightweight Session Replay and Click Heatmap inside Vortex using Cloudflare R2 storage, rrweb recording, 7-day retention, and plan-gated ULTRA access.

**Architecture:** A client-side tracker (`SessionTracker`) streams DOM mutations and click coordinates to an ingest route with native gzip. The backend stores `.json.gz` payloads directly into Cloudflare R2 (bucket `vortex`) and records lightweight metadata in PostgreSQL. The admin features an interactive Replay player and HTML5 Canvas Heatmap.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma ORM, Cloudflare R2 (`@aws-sdk/client-s3`), `rrweb`, `rrweb-player`, TailwindCSS v4, Lucide React.

## Global Constraints

- Exclusively for ULTRA plan (PRO and FREE show upgrade CTA).
- Input fields completely masked (`maskAllInputs: true`) for total privacy.
- Payloads stored in Cloudflare R2 (`vortex/replays/{campaignId}/{sessionId}.json.gz`).
- 7-day retention policy.
- Dark theme styling adhering to Vortex design system (`/impeccable`).

---

### Task 1: Dependencies & Cloudflare R2 Storage Client
**Files:**
- Create: `src/lib/r2.ts`
- Modify: `package.json`

- [ ] **Step 1: Install `@aws-sdk/client-s3`, `rrweb`, and `rrweb-player`**
- [ ] **Step 2: Implement singleton S3 client in `src/lib/r2.ts`**
- [ ] **Step 3: Add test script/check to verify upload and read from bucket `vortex`**

### Task 2: Database Schema & Plan Limits
**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/plans.ts`

- [ ] **Step 1: Add `sessionRecordingEnabled` to Campaign model**
- [ ] **Step 2: Add `SessionRecording` and `HeatmapClick` models**
- [ ] **Step 3: Add `sessionRecording` feature flag to `PLAN_LIMITS` (ULTRA: true)**
- [ ] **Step 4: Run `npx prisma db push` or migration and `npx prisma generate`**

### Task 3: Ingestion & Retrieval API Routes
**Files:**
- Create: `src/app/api/analytics/recordings/ingest/route.ts`
- Create: `src/app/api/analytics/recordings/[id]/stream/route.ts`
- Create: `src/app/api/analytics/recordings/[id]/heatmap/route.ts`
- Create: `src/app/api/analytics/recordings/[id]/toggle/route.ts`

- [ ] **Step 1: Ingest route with validation (campaign active + sessionRecordingEnabled + ULTRA plan)**
- [ ] **Step 2: Stream route to fetch `.json.gz` from R2 and stream decompressed JSON to admin**
- [ ] **Step 3: Heatmap route aggregating `HeatmapClick` coordinates by device**
- [ ] **Step 4: Toggle route to enable/disable recording on a campaign**

### Task 4: Public Page Tracking Component
**Files:**
- Create: `src/components/analytics/SessionTracker.tsx`
- Modify: `src/app/[slug]/page.tsx`
- Modify: `src/app/c/[code]/page.tsx`
- Modify: `src/app/custom-domain/[hostname]/page.tsx`

- [ ] **Step 1: Build `SessionTracker.tsx` using dynamic import for `rrweb`**
- [ ] **Step 2: Inject `SessionTracker` in public campaign routes**

### Task 5: Admin UI: "Gravações & Calor" Tab, Replay Player & Heatmap
**Files:**
- Modify: `src/components/admin/campaign-tabs.tsx`
- Create: `src/app/admin/campaigns/[id]/recordings/page.tsx`
- Create: `src/components/admin/recordings/ReplayPlayerModal.tsx`
- Create: `src/components/admin/recordings/HeatmapView.tsx`
- Create: `src/components/admin/recordings/SessionsList.tsx`

- [ ] **Step 1: Add tab to `campaign-tabs.tsx`**
- [ ] **Step 2: Build `SessionsList.tsx` with session cards, duration, device, UTM badges**
- [ ] **Step 3: Build `ReplayPlayerModal.tsx` using `rrweb-player` matching Vortex design**
- [ ] **Step 4: Build `HeatmapView.tsx` with Canvas thermal gradient and Mobile/Desktop toggle**
- [ ] **Step 5: Assemble `recordings/page.tsx` with plan guard banner if not ULTRA**

### Task 6: Verification & Quality Gates
- [ ] **Step 1: Run `npx tsc --noEmit`**
- [ ] **Step 2: Run `npm run lint`**
- [ ] **Step 3: Run `npm test`**
- [ ] **Step 4: End-to-end test on live campaign page and admin player**
