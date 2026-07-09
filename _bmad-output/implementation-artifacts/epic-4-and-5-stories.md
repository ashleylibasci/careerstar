# Epics 4 & 5 — Stories (combined record)

Built and verified together on 2026-07-08. Commit: `e4545e0` (pushed → Amplify).

## Epic 4 — Trust & Safety Hardening (all → review)

### 4.1 Treat free-text as data (prompt-injection defense)
- **Design mitigation:** the LLM layer (`lib/explain/explain.ts`) never receives the user's raw free-text — only the computed numbers + a controlled interest vocabulary. The system prompt also instructs the model to treat data as data. So there is no untrusted-text injection path through the LLM. Combined with input validation (4.2). ✅

### 4.2 Input validation and length caps
- `lib/security/limits.ts` — server-side `validateInput`, 2000-char cap. Verified: >2000 chars → HTTP 400. ✅

### 4.3 Rate limiting and cost control
- `lib/security/rate-limit.ts` — fixed-window per-IP limiter (20 req / 60s) → 429 with `Retry-After`. In-memory per instance (documented serverless trade-off). Verified: 20×200 then 429s. ✅

### 4.4 Secrets management and secure deployment posture
- Secrets server-side only (`ANTHROPIC_API_KEY` via env, never `NEXT_PUBLIC_`, gitignored). `next.config.ts` adds security headers (nosniff, X-Frame-Options DENY, HSTS, Referrer-Policy, Permissions-Policy). HTTPS enforced by Amplify. Verified headers present. ✅

## Epic 5 — "How It's Built" Page (→ review)

### 5.1 Public architecture page
- `app/architecture/page.tsx` — static `/architecture` route: the flow (offline pipeline → security → scorer → LLM → cards) + the 7 ADs and what each prevents. No input/data/LLM dependency; decoupled from scoring. Linked in site nav (Home / Methodology / How it's built). Verified HTTP 200. ✅

### Files
- NEW: `lib/security/limits.ts`, `lib/security/rate-limit.ts`, `app/architecture/page.tsx`
- UPDATE: `app/api/score/route.ts` (rate limit + validation), `next.config.ts` (headers), `app/layout.tsx` (nav), `app/components/CareerForm.tsx` (Link)

### Verification
- `npm test` 4/4, `npm run lint` clean, `npm run build` compiles. Smoke: 429 after 20 req, 400 over cap, headers present, /architecture + /methodology 200.
