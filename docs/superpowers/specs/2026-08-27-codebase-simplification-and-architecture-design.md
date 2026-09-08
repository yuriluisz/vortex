# Design Spec: Codebase Simplification & Domain Architecture (Ponytail)

## 1. Context & Motivation

Vórtex+ has grown rapidly with features including multi-tenancy, campaign management, WhatsApp automation with Evolution API, Asaas subscription billing, and public template galleries. However, several Server Action files have become overgrown monoliths containing dead code, duplicated schemas, and mixed responsibilities:
- `src/app/admin/actions.ts` (1,020 lines) contains obsolete `createCampaignAction` and `updateCampaignAction` (replaced by `saveCampaignAction`), along with duplicated Zod schemas.
- `src/app/admin/settings/actions.ts` (1,123 lines) combines user profile editing, public profile social links, email 2FA OTP, fiscal/billing data, avatar uploads, and complex Asaas subscription lifecycle management.
- `src/workers/index.ts` repeats raw Redis instantiations rather than reusing a connection factory from `@/lib/redis`.
- Several UI components trigger React 19 cascading render warnings due to synchronous `setState` in `useEffect`.

Applying **Ponytail discipline** (YAGNI, minimal code, standard library first, zero speculative abstractions), this spec organizes the structure and eliminates dead bloat without breaking any existing functionality.

---

## 2. Ponytail Audit Findings

| Tag | Target | Replacement / Action | Location | Lines Cut |
|---|---|---|---|---|
| `delete:` | `createCampaignAction` & `updateCampaignAction` | None (already superseded by `saveCampaignAction`) | `src/app/admin/actions.ts` | -240 lines |
| `delete:` | `CampaignSchema` duplicate | None (use `SaveCampaignSchema`) | `src/app/admin/actions.ts` | -67 lines |
| `delete:` | `updateUserNameAction` & `UserNameSchema` | None (handled by `updateCombinedSettingsAction`) | `src/app/admin/settings/actions.ts` | -33 lines |
| `shrink:` | 4x raw `new Redis(...)` inline connections | Shared Redis connection helper | `src/workers/index.ts` | -20 lines |
| `shrink:` | 1,123-line `settings/actions.ts` monolith | Split into `profile-actions.ts` and `billing-actions.ts` with re-export facade | `src/app/admin/settings/` | Cleaner cohesion |
| `shrink:` | 1,020-line `admin/actions.ts` monolith | Split into domain-specific campaign and group actions with re-export facade | `src/app/admin/` | Cleaner cohesion |
| `native:` | Synchronous `setState` in `useEffect` warnings | React 19 compliant event handlers / state derivations | Admin components | 0 warnings |

**Net Estimate:** ~360 lines of dead code deleted, 0 new dependencies, 100% test coverage maintained.

---

## 3. Target Architecture & File Structure

```text
src/
├── app/
│   └── admin/
│       ├── actions.ts                  # Clean barrel re-exporting campaign & group actions (backwards-compatible)
│       ├── campaigns/
│       │   └── actions.ts              # Campaign-specific actions (save, delete, toggle status/protection, custom domain)
│       │   └── [id]/
│       │       └── groups/
│       │           └── actions.ts      # Group-specific actions (create, delete, toggle, auto-create)
│       ├── settings/
│       │   ├── actions.ts              # Clean barrel re-exporting profile & billing actions (backwards-compatible)
│       │   ├── profile-actions.ts      # Profile, public community handle/socials, avatar, email 2FA
│       │   └── billing-actions.ts      # Asaas subscriptions, checkout, prorate, cancel, reactivate, billing info
│       └── ...
├── lib/
│   ├── redis.ts                        # Shared Redis instance & connection options factory
│   └── ...
└── workers/
    └── index.ts                        # Uses Redis connection helper cleanly
```

---

## 4. Non-Functional Requirements & Invariants

1. **Backwards Compatibility:** All existing imports from `@/app/admin/actions` and `@/app/admin/settings/actions` will continue to resolve without breaking any caller.
2. **Zero Behavior Change:** All business logic (Asaas webhooks, Evolution API calls, Cloudflare custom hostname provisioning, audit logs, plan limit checks) remains strictly identical.
3. **Quality Gates:** Must pass `npm test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`.
