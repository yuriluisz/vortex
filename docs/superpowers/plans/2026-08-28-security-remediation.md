# Security Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement surgical, ponytail-clean fixes for the security vulnerabilities identified in the audit report (SEC-05, SEC-02, SEC-06, SEC-03).

**Architecture:** Apply root-cause fixes directly in the respective services and actions without adding new dependencies or unnecessary abstractions. Reuse existing utility functions (`escapeHtml`, `requireAuth`).

**Tech Stack:** TypeScript 5, Next.js 16 Server Actions, DOMPurify, Vitest.

## Global Constraints

- No new runtime dependencies.
- Surgical changes only (touch only affected lines).
- Must pass `npm test`, `npx tsc --noEmit`, and `npm run lint`.

---

### Task 1: Sanitize Dynamic Strings in Transactional Emails (SEC-05)

**Files:**
- Modify: `src/lib/notifications.ts:3-15, 134, 226, 272`
- Test: `src/tests/email-template.test.ts`

**Interfaces:**
- Consumes: `escapeHtml` from `@/lib/email-template`
- Produces: Sanitized HTML emails delivered via Resend

- [ ] **Step 1: Write the test verifying HTML escaping in email notifications**

```typescript
// in src/tests/email-template.test.ts
it("should properly escape special characters in notification strings", () => {
  const maliciousInput = '<script>alert("xss")</script>&"\'';
  const escaped = escapeHtml(maliciousInput);
  expect(escaped).not.toContain("<script>");
  expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&quot;&#039;');
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npx vitest run src/tests/email-template.test.ts`
Expected: PASS

- [ ] **Step 3: Update `src/lib/notifications.ts` to escape all dynamic parameters**

In `src/lib/notifications.ts`:
1. Import `escapeHtml` from `@/lib/email-template`.
2. In `sendGracePeriodWarningEmail`: replace `${tenantName}` with `${escapeHtml(tenantName)}` and `${planName}` with `${escapeHtml(planName)}`.
3. In `sendTemplateStatusEmail`: replace `${authorName}` with `${escapeHtml(authorName)}` and `${templateName}` with `${escapeHtml(templateName)}`.
4. In `sendDowngradeEmail`: replace `${tenantName}` with `${escapeHtml(tenantName)}`.

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: PASS

---

### Task 2: Enforce Server-Side Role Check on Campaign Sharing (SEC-02)

**Files:**
- Modify: `src/app/admin/campaign-share-actions.ts:29-35, 150-156`

**Interfaces:**
- Consumes: `session.role` from `getSession()`
- Produces: Rejection error `{ error: "Apenas administradores podem gerenciar compartilhamentos de campanhas." }` when `session.role === "MEMBER"`

- [ ] **Step 1: Add role guard in `shareCampaignAction` and `revokeCampaignShareAction`**

In `src/app/admin/campaign-share-actions.ts`:
```typescript
if (session.role === "MEMBER") {
  return { error: "Apenas administradores podem gerenciar compartilhamentos de campanhas." };
}
```

- [ ] **Step 2: Run typecheck to verify compilation**

Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 3: Restrict Iframe Origins in Landing Page HTML Renderer (SEC-06)

**Files:**
- Modify: `src/app/[slug]/HtmlRenderer.tsx:37-67`

**Interfaces:**
- Consumes: DOMPurify output
- Produces: Sanitized HTML with iframe sources restricted to allowed video providers (YouTube, Vimeo)

- [ ] **Step 1: Update `extractBodyContent` in `src/app/[slug]/HtmlRenderer.tsx`**

Sanitize iframes by filtering out unapproved iframe sources matching the logic in `template-sanitizer.ts`:
```typescript
const allowedIframeHosts = ["youtube.com", "www.youtube.com", "youtu.be", "player.vimeo.com", "vimeo.com", "www.vimeo.com"];
```

- [ ] **Step 2: Run test suite**

Run: `npm test`
Expected: PASS

---

### Task 4: Clean Residual Cloudflare Token Placeholder Check (SEC-03)

**Files:**
- Modify: `src/services/cloudflare.service.ts:8-13`

**Interfaces:**
- Consumes: `process.env.CLOUDFLARE_API_TOKEN`
- Produces: Clean authorization header

- [ ] **Step 1: Simplify `getHeaders` in `src/services/cloudflare.service.ts`**

Change:
```typescript
if (token && token !== "seu_token_aqui") {
```
To:
```typescript
if (token) {
```

- [ ] **Step 2: Run unit tests for Cloudflare service**

Run: `npx vitest run src/tests/cloudflare.test.ts`
Expected: PASS

---

### Task 5: Final Verification Battery

- [ ] **Step 1: Run TypeScript strict typecheck**
Run: `npx tsc --noEmit`

- [ ] **Step 2: Run all unit tests**
Run: `npm test`

- [ ] **Step 3: Run ESLint**
Run: `npm run lint`
