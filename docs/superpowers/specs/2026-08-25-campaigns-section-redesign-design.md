# Design Spec: Campaigns Ecosystem Modernization & Editor Fix

**Date:** 2026-08-25  
**Topic:** Campaign Editor Full-Bleed Fix, Settings Modal UX, Groups & Leads Polish  
**Status:** Approved by User  

---

## 1. Objectives

1. **Fix Critical Editor Black Screen Bug:** Eliminate the height collapse caused by `absolute inset-0` inside a padded scrollable flexbox container in `AdminShell`. Render full-bleed editor pages (`/admin/campaigns/new` and `/admin/campaigns/[id]`) with `flex-1 flex flex-col min-h-0 w-full h-full` and no padding.
2. **Elevate Editor Topbar & Preview UX:** Redesign `CampaignEditor`'s top navigation bar for optimal scannability, responsive action grouping, and smooth viewport switching.
3. **Streamline Settings Modal:** Group settings into clear categories (Geral, Formulário, Links & Blindagem) with responsive design and intuitive controls.
4. **Enhance Campaign Sub-pages (Groups, Leads, List):** Refine tables, status indicators, and progress bars with consistent dark-mode styling.
5. **Code Economy (Ponytail):** Simplify layout wrappers, eliminate duplicate CSS classes, and maintain zero new dependencies.

---

## 2. Affected Files

- `src/components/admin/admin-shell.tsx`
- `src/app/admin/campaigns/[id]/layout-shell.tsx`
- `src/app/admin/campaigns/new/page.tsx`
- `src/components/admin/campaign-editor.tsx`
- `src/components/admin/campaign-settings-modal.tsx`
- `src/components/admin/campaign-tabs.tsx`
- `src/app/admin/campaigns/[id]/groups/page.tsx`
- `src/app/admin/campaigns/[id]/leads/page.tsx`
- `src/app/admin/campaigns/campaigns-client.tsx`

---

## 3. Verification Plan
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
