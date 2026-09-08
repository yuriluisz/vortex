# Design Spec: Admin Dashboard Enhancement & Optimization

**Date:** 2026-08-25  
**Topic:** Admin Dashboard UI/UX Polish, Consolidated Performance Chart & Campaign Card Actions  
**Status:** Approved by User (Plan A)  

---

## 1. Objectives

1. **Elevate Visual Polish & UX Hierarchy:** Transform the main Admin Dashboard (`/admin`) into a sleek, modern, executive-level interface aligned with Vortex's dark-mode identity (emerald/cyan glow accents, glass-panels, crisp typography).
2. **Consolidate Performance Charts:** Replace 3 narrow parallel area charts with a unified, interactive chart component featuring metric tabs (`Leads`, `Visitas`, `Conversão`, `Combinado`) and dynamic period toggle (7d/30d) with clean tooltip styling and smooth transitions.
3. **Enhance Campaign Card Usability:** Provide immediate actionable context on campaign cards (live status badge, total views & conversion rate, quick "Copiar Link" button with instant visual feedback, and quick link to the campaign's leads).
4. **Code Economy (Ponytail Discipline):** Remove repetitive Recharts `<ResponsiveContainer>` definitions and duplicate CSS/handlers, cutting ~150+ lines of redundant code while delivering a richer user experience.

---

## 2. Architecture & File Breakdown

### Modified Files:
1. **`src/app/admin/dashboard-charts.tsx`**:
   - Refactor into a unified, responsive single-chart component with metric switchers (`Leads` / `Visitas` / `Conversão` / `Geral`).
   - Unified `ResponsiveContainer`, unified gradient definitions, and clean tooltip formatting.
   - Keep campaign filter dropdown and 7d/30d period selector.
2. **`src/app/admin/page.tsx`**:
   - Enhance the 4 KPI cards with polished icon containers, subtle gradient hover accents, and tabular numeral typography.
   - Enhance campaign cards with:
     - Conversion rate badge (`Leads / Views %`).
     - Views count counter.
     - "Copiar Link" button with copy feedback.
     - Direct button to Leads (`/admin/campaigns/${campaign.id}/leads`).
     - Compact progress bars for WhatsApp groups.
3. **`src/components/admin/campaign-card-actions.tsx` (or inline client component if needed for clipboard interaction)**:
   - Minimal client component for "Copiar Link" with clipboard copy and toast/tooltip state.

---

## 3. Detailed Component Design

### 3.1 Unified `DashboardCharts` (`src/app/admin/dashboard-charts.tsx`)
- Metric selection tabs:
  - **Leads** (Primary theme: Blue / Cyan `hsl(221, 100%, 70%)` with area gradient)
  - **Visitas** (Theme: Violet / Purple `hsl(260, 100%, 70%)` with area gradient)
  - **Conversão %** (Theme: Emerald / Green `hsl(160, 100%, 40%)` with area gradient)
- Summary pills right above the chart showing the total for the selected metric.
- Height: 240px with generous margins so Y-axis labels are never clipped.
- Keyboard navigation and click-outside preserved for the campaign filter dropdown.

### 3.2 Campaign Cards in `src/app/admin/page.tsx`
- Header: Campaign Name + Active Pulse Indicator + Total Leads count.
- Meta bar: Views count (`X visitas`) + Conversion Rate pill (`Y% conversão`).
- Quick actions:
  - Copy Link button with copy icon.
  - Link to `/admin/campaigns/[id]/leads`.
- Group capacity list: clean list of groups with percent bar.

---

## 4. Verification Plan
- Typecheck: `npx tsc --noEmit`
- Lint: `npm run lint`
- Unit tests: `npm test`
- Build check: `npm run build`
