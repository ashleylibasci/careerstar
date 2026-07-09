---
baseline_commit: f2546b3
---

# Story 2.2: Implement the deterministic scorer module

Status: review

## Story

As a developer, I want a pure `lib/scorer` module that computes the 0–100 risk-adjusted score from the dataset and parsed input, so that scoring is the single, testable source of truth.

## Acceptance Criteria

1. Given an occupation and the user's interest signals, the scorer returns a 0–100 score plus component sub-scores (return, risk, fit) using documented weights. ✅
2. Formula: Return = wGrowth·growthRank + wPay·payRank; Risk = wExposure·exposure + wVolatility·volatility; RAV = Return·(1−γ·Risk); Score = 100·[α·RAV + (1−α)·Fit]. ✅
3. Volatility is a constructed, labeled proxy (no public source). ✅
4. Pure and deterministic; unit test pins the score for a known input. ✅

## Tasks / Subtasks

- [x] `lib/scorer/types.ts` — add `Occupation` type.
- [x] `lib/scorer/scorer.ts` — pure `computeScore` / `computeScores`; documented `WEIGHTS`; percentile-normalized growth+pay; constructed volatility proxy; fit = fraction of user interests matched. No I/O, no randomness, no LLM.
- [x] `lib/scorer/scorer.test.ts` — 4 tests via `node --test` (determinism, pinned Alpha=94, low-score case, unknown-code skip). `npm run test`.
- [x] Verify: tests pass, lint + build pass, tsconfig excludes test files from the Next build.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (BMAD dev-story)

### Completion Notes List

- Scorer is dependency-injected (takes the dataset as a parameter) → trivially unit-testable and keeps I/O out of the math. Story 2.4 will load `data/data.json` and pass it in.
- Weights are exported constants — the sensitivity-analysis lever. Pinned test value (Alpha=94, {return:100,risk:14,fit:100}) matches the hand-derivation.
- Ran on Node 26 native TS test runner (no test-framework dependency added).

### File List

- `lib/scorer/types.ts` (UPDATE — Occupation type)
- `lib/scorer/scorer.ts` (NEW — scoring model)
- `lib/scorer/scorer.test.ts` (NEW — unit tests)
- `package.json` (UPDATE — `test` script)
- `tsconfig.json` (UPDATE — exclude `**/*.test.ts`)

### Change Log

- 2026-07-08: Deterministic scoring model + tests; all ACs verified; commit `563ec4f`. Status → review.
