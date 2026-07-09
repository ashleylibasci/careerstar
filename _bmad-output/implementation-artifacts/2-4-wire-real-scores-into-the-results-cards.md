---
baseline_commit: 563ec4f
---

# Story 2.4: Wire real scores into the results cards

Status: review

## Story

As a visitor, I want the score cards to show real scores with the component breakdown, so that I get grounded, legible results instead of a placeholder.

## Acceptance Criteria

1. `/api/score` uses the scorer over parsed input + `data.json` → real 0–100 scores per path with return/risk/fit sub-scores + factual note. ✅
2. Placeholder logic fully replaced. ✅ (placeholder.ts deleted)
3. Results return within the ~10s target (deterministic, near-instant). ✅

## Tasks / Subtasks

- [x] `app/api/score/route.ts` — import `data/data.json`, `parseInput` → `computeScores`, sort desc, top-6, attach factual growth/exposure note. `placeholder: false`.
- [x] Removed `lib/scorer/placeholder.ts`; `ScoreResult` gains `code`; `CareerForm` renders real cards + no-match message.
- [x] Verified live (dev): real grounded scores with meaningful spread (Data Scientists 55 > Software Developers 44 > Computer Programmers 21); lint + build + unit tests pass.

## Dev Agent Record

### Agent Model Used
claude-opus-4-8 (BMAD dev-story)

### Completion Notes List
- The UI contract (`ScoreResponse`/`ScoreCard`) was unchanged from Story 1.3 → swapping placeholder for the real scorer required no UI rework, exactly as intended by the stable contract.
- Note line is factual + deterministic (growth + exposure); the LLM plain-English explanation is Epic 3 (Story 3.1).
- Pushed to `main` → AWS Amplify auto-deploy triggered.

### File List
- `app/api/score/route.ts` (UPDATE — real scoring)
- `app/components/CareerForm.tsx` (UPDATE — no-match message, key by code)
- `lib/scorer/types.ts` (UPDATE — code, message fields)
- `lib/scorer/scorer.ts` (UPDATE — emit code)
- `lib/scorer/placeholder.ts` (DELETED)

### Change Log
- 2026-07-08: Real scores wired into the live endpoint; verified; commit `29c1bc0`. Status → review.
