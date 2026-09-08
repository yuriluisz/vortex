# Admin Dashboard Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the main Admin Dashboard (`/admin`) into a high-craft, high-density interface with a consolidated performance chart (tabs for Leads, Visitas, Conversão), actionable campaign cards with quick copy links and conversion pills, polished KPI cards, and streamlined Ponytail-optimized code.

**Architecture:** Refactor `src/app/admin/dashboard-charts.tsx` into a single unified interactive chart, add a minimal client component for copy link action `src/components/admin/copy-campaign-link.tsx`, and enhance `src/app/admin/page.tsx` with enriched card metadata and refined KPI cards.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, TailwindCSS v4, Recharts, Lucide React, Framer Motion.

## Global Constraints
- Strictly adhere to Next.js 16 Server vs Client Component boundaries.
- Zero new runtime dependencies; reuse existing Recharts, Lucide icons, and Tailwind tokens.
- Ponytail discipline: concise code, no boilerplate, no redundant containers or wrappers.

---

### Task 1: Create Minimal Copy Link Client Component

**Files:**
- Create: `src/components/admin/copy-campaign-link.tsx`

**Interfaces:**
- Consumes: `slug: string`, `customDomain?: string | null`
- Produces: `<CopyCampaignLink slug={campaign.slug} customDomain={campaign.customDomain} />`

- [ ] **Step 1: Write `src/components/admin/copy-campaign-link.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyCampaignLink({
  slug,
  customDomain,
}: {
  slug: string;
  customDomain?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = customDomain
      ? `https://${customDomain}`
      : `${origin}/${slug}`;

    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copiar link público da campanha"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground bg-secondary/50 hover:bg-secondary hover:text-foreground transition-colors border border-border/50"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-primary animate-scale-in" />
          <span className="text-primary text-[11px]">Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          <span className="text-[11px]">Link</span>
        </>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Typecheck**
Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 2: Refactor `DashboardCharts` into a Unified, High-Density Performance Chart

**Files:**
- Modify: `src/app/admin/dashboard-charts.tsx`

**Interfaces:**
- Consumes: `initialData?: DayPoint[]`, `initialCampaigns?: { id: string; name: string }[]`
- Produces: `<DashboardCharts initialData={...} initialCampaigns={...} />`

- [ ] **Step 1: Refactor `src/app/admin/dashboard-charts.tsx`**
Implement single ResponsiveContainer, metric switcher tabs (`Leads`, `Visitas`, `Conversão`, `Combinado`), responsive layout, polished tooltip, and campaign/range filters.

- [ ] **Step 2: Typecheck**
Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 3: Enhance KPI Metrics & Campaign Cards in `src/app/admin/page.tsx`

**Files:**
- Modify: `src/app/admin/page.tsx`

**Interfaces:**
- Server Component that fetches campaigns with views, leads, groups, and renders enhanced KPI cards and campaign cards.

- [ ] **Step 1: Update `src/app/admin/page.tsx`**
Enrich campaign cards with:
- Status indicator pulse
- Conversion rate badge
- Views counter
- Copy link action
- Direct link to leads
- Refined WhatsApp group capacity bars

- [ ] **Step 2: Typecheck & Lint**
Run: `npx tsc --noEmit && npm run lint`
Expected: PASS

---

### Task 4: Full Quality Gate Verification

- [ ] **Step 1: Run unit tests**
Run: `npm test`
Expected: PASS

- [ ] **Step 2: Run build**
Run: `npm run build`
Expected: PASS
