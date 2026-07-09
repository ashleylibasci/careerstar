# Epic 3 — Stories 3.1–3.4 (combined record)

Built and verified together on 2026-07-08. Commits: `abf58f8`, `302750a` (3.1), `5c621fc` (3.2–3.4).

## Story 3.1: LLM explanation layer — Status: review
- **AC:** server-side Claude call explains the computed score (never computes it); graceful fallback if LLM unavailable. ✅
- `lib/explain/explain.ts` — `claude-haiku-4-5`, one sentence per path, sends only computed numbers + controlled interest tags (no raw user text → no injection surface here). Returns empty map → factual-note fallback on missing key or error.
- `.env.local.example` documents `ANTHROPIC_API_KEY` (server-side only).
- **Pending activation:** real explanations require Ashley to set `ANTHROPIC_API_KEY` (locally in `.env.local` + as an AWS Amplify env var). Verified the fallback path works with no key (factual notes, no crash).

## Story 3.2: Redirect to a stronger adjacent path — Status: review
- **AC:** paths below the viability threshold get a higher-scoring, skill-adjacent redirect; no low score without a redirect. ✅
- `lib/scorer/redirect.ts` — `VIABILITY_THRESHOLD = 45`; ranks higher-scoring occupations by Jaccard skill similarity to the low path. Verified: Computer Programmers (21) → Software Developers (47), "reuses your programming & software strengths."

## Story 3.3: Limitations & honest framing — Status: review
- **AC:** each result states what the score does/doesn't mean; exposure ≠ displacement; data-as-of; methodology link. ✅
- Honest-framing footer under results in `CareerForm`; ScoreCard renders the note; page already carried the "grounded estimate, not a prediction" line.

## Story 3.4: Methodology & sources page — Status: review
- **AC:** `/methodology` documents the model, weights, data sources (with attribution), and limitations. ✅
- `app/methodology/page.tsx` (static). Verified HTTP 200.

### Files
- NEW: `lib/explain/explain.ts`, `lib/scorer/redirect.ts`, `app/methodology/page.tsx`, `.env.local.example`
- UPDATE: `app/api/score/route.ts`, `app/components/CareerForm.tsx`, `app/components/ScoreCard.tsx`, `lib/scorer/types.ts`, `package.json`, `.gitignore`
- Dependency added: `@anthropic-ai/sdk@^0.110.0`
