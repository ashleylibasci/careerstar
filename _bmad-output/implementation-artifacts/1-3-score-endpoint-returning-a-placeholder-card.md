---
baseline_commit: b707b02
---

# Story 1.3: Score endpoint returning a placeholder card

Status: review

<!-- Third story of Epic 1. Wires the request→response path end to end with PLACEHOLDER scoring. -->

## Story

As a visitor,
I want to submit my text and receive a score card back,
so that the full request→response path works before real scoring exists.

## Acceptance Criteria

1. **Given** I have entered text and submit, **When** the client POSTs to `/api/score`, **Then** a Route Handler returns a structured JSON score card: a total score (0–100), placeholder component sub-scores (return, risk, fit), a path label, and a note flagging it as placeholder.
2. **Given** the response, **When** it returns, **Then** the UI renders the card (total score, the three components, the note) below the form.
3. **Given** the same input text, **When** submitted twice, **Then** the placeholder score is identical (deterministic — no randomness, no LLM).
4. **Given** an empty or missing body, **When** it hits `/api/score`, **Then** the handler responds with a 400 and a clear error message (no crash).
5. **Given** a submit is in flight, **When** waiting, **Then** the button shows a loading state and is disabled to prevent double-submits.

## Tasks / Subtasks

- [x] Task 1: Define the shared score types (AC: 1) — `lib/scorer/types.ts` (`ScoreComponents`, `ScoreResult`, `ScoreResponse`).
- [x] Task 2: Placeholder scorer (AC: 1, 3) — `lib/scorer/placeholder.ts`, pure + deterministic (FNV-1a hash, no `Math.random`), commented as a Story 2.2 stand-in.
- [x] Task 3: Route Handler (AC: 1, 4) — `app/api/score/route.ts` POST: parses `{ text }`, 400 on missing/empty, else 200 `placeholderScore(text)`.
- [x] Task 4: Render the card in the UI (AC: 2, 5) — `CareerForm` fetches, shows loading, renders `ScoreCard`(s), handles errors; added `app/components/ScoreCard.tsx`.
- [x] Task 5: Verify (AC: all) — lint + build pass; deterministic scores confirmed; empty/missing body → 400.

## Dev Notes

### Scope boundary
- Scoring here is a **deterministic placeholder** — not the real model. It exists only to prove the end-to-end path (form → route handler → JSON → rendered card). The real data-grounded scorer is **Story 2.2**, real parsing is **2.3**, and wiring real scores into these cards is **2.4**. Keep the response *shape* realistic so later stories swap internals without changing the UI contract.
- No LLM call here (that is Epic 3). No external data.

### Technical guidance
- **Route Handler** lives at `app/api/score/route.ts` and exports an async `POST(request: Request)` (App Router convention). Return `Response.json(...)` with appropriate status.
- Keep the placeholder scorer **pure and in `lib/scorer/`** (per AD-2) so Story 2.2 replaces it in place. Determinism: hash the string (e.g. sum/rolling char codes) and map into 0–100 ranges — same input always yields the same output.
- The UI contract (`ScoreResponse`) is shared between the route and the form via `lib/scorer/types.ts` — import the type on both sides.
- Do not add dependencies.

### Files to touch
- `lib/scorer/types.ts` (NEW), `lib/scorer/placeholder.ts` (NEW)
- `app/api/score/route.ts` (NEW)
- `app/components/CareerForm.tsx` (UPDATE), optionally `app/components/ScoreCard.tsx` (NEW)

### References
- [Source: epics.md#Epic-1-Story-1.3] — acceptance criteria.
- [Source: ARCHITECTURE-SPINE.md#AD-2] — scorer is a pure module; UI only renders.
- [Source: ARCHITECTURE-SPINE.md#AD-4] — LLM never computes the score (not used here at all).

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (BMAD dev-story)

### Debug Log References

- None. Lint and build passed first try; endpoint verified with curl.

### Completion Notes List

- End-to-end path proven: form → `POST /api/score` → JSON → rendered `ScoreCard`.
- Placeholder scorer is deterministic (FNV-1a hash → fixed ranges), pure, and lives in `lib/scorer/` so Story 2.2 can replace it in place without touching the UI contract.
- Verified: identical output for identical input; empty and missing bodies both return 400; loading state disables the button ("Scoring…").
- All checkboxes complete: [x] Task 1–5.

### File List

- `lib/scorer/types.ts` (NEW — ScoreResponse contract)
- `lib/scorer/placeholder.ts` (NEW — deterministic placeholder scorer)
- `lib/scorer/.gitkeep` (DELETED — dir now has real files)
- `app/api/score/route.ts` (NEW — POST handler + 400 validation)
- `app/components/ScoreCard.tsx` (NEW — result card)
- `app/components/CareerForm.tsx` (UPDATE — fetch, loading, render cards, error handling)

### Change Log

- 2026-07-08: Score endpoint + placeholder card wired end to end; all ACs verified; commit `6dfb409`. Status → review.
