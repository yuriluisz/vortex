# Campaigns Section Modernization & Editor Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the black-screen bug in the Campaign Editor, elevate the visual hierarchy of the editor topbar, settings modal, groups, leads, and campaigns list using modern dark-mode craft and Ponytail simplicity.

**Architecture:** Route-aware full-bleed layout rendering in `AdminShell`, clean in-flow editor flex container, modular and intuitive settings tabs, and cohesive UI styling across the campaign lifecycle.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, TailwindCSS v4, Monaco Editor, Lucide React, Framer Motion.

---

### Task 1: Fix Full-Bleed Editor Container in `AdminShell`, `layout-shell.tsx`, and `new/page.tsx`
- Modify `src/components/admin/admin-shell.tsx`: Detect editor routes and remove padding/scroll for full-bleed editor.
- Modify `src/app/admin/campaigns/[id]/layout-shell.tsx`: Use `flex-1 flex flex-col min-h-0 w-full h-full`.
- Modify `src/app/admin/campaigns/new/page.tsx`: Use `flex-1 flex flex-col min-h-0 w-full h-full`.

### Task 2: Polish `CampaignEditor` Top Bar & Viewport Preview
- Modify `src/components/admin/campaign-editor.tsx`: Clean top bar, status badge toggle, responsive actions, and polished preview frame.

### Task 3: Refactor & Polish `CampaignSettingsModal`
- Modify `src/components/admin/campaign-settings-modal.tsx`: Structured tabs, clear section cards for General, Form Builder, and Links/Protection.

### Task 4: Polish Campaign Tabs, Groups, Leads & List
- Modify `src/components/admin/campaign-tabs.tsx`
- Modify `src/app/admin/campaigns/[id]/groups/page.tsx`
- Modify `src/app/admin/campaigns/[id]/leads/page.tsx`
- Modify `src/app/admin/campaigns/campaigns-client.tsx`

### Task 5: Quality Gate & Verification
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
