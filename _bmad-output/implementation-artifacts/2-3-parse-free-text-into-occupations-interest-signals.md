---
baseline_commit: 563ec4f
---

# Story 2.3: Parse free-text into occupations + interest signals

Status: review

## Story

As a visitor, I want my free-text mapped to real occupations and interest/skill signals, so that the scorer rates the paths I actually mean.

## Acceptance Criteria

1. Free-text parsed into candidate occupations (O*NET-SOC codes) + interest/skill tokens. ✅
2. Ambiguous/unmatched input handled gracefully — never fails silently. ✅ (empty match → interest-overlap fallback, else helpful message)

## Tasks / Subtasks

- [x] `lib/scorer/parse.ts` — deterministic keyword/alias map (free-text → occupation codes) + interest-token extraction from the dataset's skill tags. Deduped, order-preserved. No LLM.
- [x] Verified via live smoke test: "quant/data science/software" → correct occupations; "underwater basket weaving" → 0 matches + message.

## Dev Agent Record

### Agent Model Used
claude-opus-4-8 (BMAD dev-story)

### Completion Notes List
- Alias map covers the 27 MVP occupations with student-phrasing (swe, quant, cyber, data science, etc.). Interest tokens = dataset skill tags found in the text. Contract (`ParsedInput`) is stable for a richer resolver later.

### File List
- `lib/scorer/parse.ts` (NEW)

### Change Log
- 2026-07-08: Free-text parser; verified live; commit `29c1bc0`. Status → review.
