# Design Spec: Meus Templates Modernization

**Date:** 2026-08-25  
**Topic:** Templates Dashboard (`/admin/templates`) Redesign & UX Polish  
**Status:** Approved by User  

---

## 1. Objectives

1. **Elevate First Impression:** Implement a modern dark-mode interface for `/admin/templates` with a vibrant header, glowing primary CTA (*Publicar Template*), and a secondary glass button (*Explorar Mercado*).
2. **Interactive KPI Stat Cards:** Display three thematic status cards (Publicados, Em análise, Rejeitados) with dedicated icons, badge counts, and context labels.
3. **Rich Template Cards Grid:** Surface template categories, theme badges, creation date, structured engagement counters (Views, Usages, Likes), rejection notices, and quick action menus.
4. **Refined Modals:** Upgrade `PublishModal` and `EditTemplateModal` to the modern glassmorphism design with rounded inputs and clear feedback.
5. **Code Economy (Ponytail):** Reuse standard UI tokens and utilities with minimal lines of code and zero new dependencies.

---

## 2. Affected Files

- `src/app/admin/templates/page.tsx`
- `src/app/admin/templates/publish-button.tsx`
- `src/app/admin/templates/publish-modal.tsx`
- `src/app/admin/templates/edit-template-modal.tsx`
- `src/app/admin/templates/template-actions-menu.tsx`

---

## 3. Verification Plan
- `npx tsc --noEmit`
- `npm run lint`
- `npm test`
