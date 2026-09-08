# Codebase Simplification & Structural Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate dead code and duplicate schemas, modularize monolithic action files into domain-cohesive modules, and clean up Redis connection boilerplate while maintaining 100% backward compatibility and test passing.

**Architecture:** Split large action files (`src/app/admin/actions.ts` and `src/app/admin/settings/actions.ts`) into cohesive domain action files (`campaigns/actions.ts`, `groups/actions.ts`, `settings/profile-actions.ts`, `settings/billing-actions.ts`) behind thin backward-compatible barrel exports. Standardize Redis connection options in `@/lib/redis.ts`.

**Tech Stack:** Next.js 16 (App Router, Server Actions, React 19), TypeScript 5 (Strict), Prisma 7, BullMQ + ioredis, Zod, Vitest.

## Global Constraints

- Never break existing import paths — keep backward-compatible re-exports in `admin/actions.ts` and `admin/settings/actions.ts`.
- Zero change to external API contracts (Asaas, Evolution API, Cloudflare).
- All Vitest tests must pass without regressions after every task.
- Strict typecheck (`npx tsc --noEmit`) must succeed with 0 errors.

---

### Task 1: Redis Connection Helper in `@/lib/redis.ts` & Worker Cleanup

**Files:**
- Modify: `src/lib/redis.ts`
- Modify: `src/workers/index.ts`
- Test: `src/tests/` (all existing tests)

**Interfaces:**
- Consumes: `ioredis`
- Produces: `getRedisConnectionOptions(): RedisOptions`, `createRedisConnection(): Redis`

- [ ] **Step 1: Update `src/lib/redis.ts` to export connection options and factory**

```typescript
import Redis, { RedisOptions } from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
};

export function getRedisUrl(): string {
  return process.env.REDIS_URL || "redis://localhost:6379";
}

export function createRedisConnection(customOptions?: Partial<RedisOptions>): Redis {
  return new Redis(getRedisUrl(), {
    ...redisOptions,
    ...customOptions,
  });
}

export const redis =
  globalForRedis.redis ??
  createRedisConnection();

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;
```

- [ ] **Step 2: Update `src/workers/index.ts` to use connection factory**

Replace inline `new Redis(...)` in `leadsWorker`, `viewsWorker`, `groupsWorker`, and `webhooksWorker` with `createRedisConnection()`.

- [ ] **Step 3: Run test suite to verify no regressions**

Run: `npm test`
Expected: PASS (12 test files, 81 tests passing).

---

### Task 2: Modularize Campaign & Group Server Actions

**Files:**
- Create: `src/app/admin/campaigns/actions.ts`
- Create: `src/app/admin/campaigns/[id]/groups/actions.ts`
- Modify: `src/app/admin/actions.ts` (Remove dead `createCampaignAction`, `updateCampaignAction`, `CampaignSchema` and re-export modular actions)
- Test: `src/tests/sync-campaign-leads.test.ts`

**Interfaces:**
- Produces: `saveCampaignAction`, `deleteCampaignAction`, `toggleCampaignStatusAction`, `toggleCampaignProtectionAction`, `checkCustomHostnameStatusAction`, `createGroupAction`, `createWhatsAppGroupAction`, `deleteGroupAction`, `toggleGroupStatusAction`, `updateGroupUrlAction`, `updateCampaignGroupSettingsAction`.

- [ ] **Step 1: Create `src/app/admin/campaigns/actions.ts`**

Extract `saveCampaignAction`, `deleteCampaignAction`, `toggleCampaignStatusAction`, `toggleCampaignProtectionAction`, and `checkCustomHostnameStatusAction` along with `SaveCampaignSchema` into this module.

- [ ] **Step 2: Create `src/app/admin/campaigns/[id]/groups/actions.ts`**

Extract `createGroupAction`, `createWhatsAppGroupAction`, `deleteGroupAction`, `toggleGroupStatusAction`, `updateGroupUrlAction`, and `updateCampaignGroupSettingsAction` with their respective Zod schemas (`GroupSchema`, `WhatsAppGroupSchema`, `CampaignGroupSettingsSchema`).

- [ ] **Step 3: Update `src/app/admin/actions.ts` as a clean facade**

Re-export all functions and types from the new modules to guarantee 100% backward compatibility for all existing UI callers.

- [ ] **Step 4: Run typecheck and tests**

Run: `npx tsc --noEmit` and `npm test`
Expected: PASS with 0 errors.

---

### Task 3: Modularize Settings Server Actions (Profile & Billing)

**Files:**
- Create: `src/app/admin/settings/profile-actions.ts`
- Create: `src/app/admin/settings/billing-actions.ts`
- Modify: `src/app/admin/settings/actions.ts` (Remove dead `updateUserNameAction`, `UserNameSchema`, re-export modular actions)
- Test: `src/tests/asaas.test.ts`

**Interfaces:**
- Produces:
  - Profile: `updateProfileAction`, `updateCombinedSettingsAction`, `updatePublicProfileAction`, `requestEmailChangeAction`, `verifyEmailChangeAction`, `uploadAvatarAction`, `removeAvatarAction`.
  - Billing: `saveBillingInfoAction`, `verifyPaymentAction`, `changePlanCheckoutAction`, `cancelSubscriptionAction`, `reactivateSubscriptionAction`.

- [ ] **Step 1: Create `src/app/admin/settings/profile-actions.ts`**

Extract user profile updating, reserved name checking, public profile / handle management, email OTP change flow, and avatar upload / removal.

- [ ] **Step 2: Create `src/app/admin/settings/billing-actions.ts`**

Extract fiscal data saving (`BillingInfoSchema`), Asaas customer provisioning, subscription checkout, prorate upgrade, cancellation, reactivation, and payment verification.

- [ ] **Step 3: Update `src/app/admin/settings/actions.ts` as a clean facade**

Re-export all functions and types from `profile-actions.ts` and `billing-actions.ts`.

- [ ] **Step 4: Run typecheck and tests**

Run: `npx tsc --noEmit` and `npm test`
Expected: PASS with 0 errors.

---

### Task 4: Fix React 19 Synchronous `setState` in `useEffect` Warnings

**Files:**
- Modify: `src/components/admin/campaign-share-modal.tsx`
- Modify: `src/components/admin/help-fab.tsx`
- Modify: `src/components/admin/team-settings-tab.tsx`
- Modify: `src/components/admin/whatsapp-status-toast.tsx`

- [ ] **Step 1: Refactor effects in the 4 target components to avoid synchronous state triggers during mount/render**
- [ ] **Step 2: Run ESLint**

Run: `npm run lint`
Expected: PASS (0 errors, warnings resolved).

---

### Task 5: End-to-End Quality Gate Verification

- [ ] **Step 1: Run unit tests**
Run: `npm test`
Expected: All 12 test files pass.

- [ ] **Step 2: Run strict TypeScript check**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Run Next.js production build**
Run: `npm run build`
Expected: Build succeeds with optimized output.
