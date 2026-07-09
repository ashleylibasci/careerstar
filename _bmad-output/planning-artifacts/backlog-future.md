---
type: backlog
date: 2026-07-09
status: deferred (not scheduled)
purpose: >
  Good ideas intentionally NOT built now, so focus stays on the O*NET-fit
  rebuild + math robustness. Each entry is a real future story, kept here so
  it survives the "drop it now" decision instead of being lost.
---

# CareerStar — Future Backlog

Deferred by Ashley on 2026-07-09 during the party-mode planning session. Nothing
here blocks the current work (O\*NET fit → sensitivity/back-test → narration).

---

## B-1 — University / major → career ROI experience  *(revive the dropped data)*

**Why deferred:** `data/universities.json` (top ~200 schools, real earnings/cost/debt
by major, from College Scorecard) shipped with **no screen consuming it** — orphaned
data. Rather than leave dead weight in the bundle while rebuilding the engine, we
**dropped the built artifact and its pipeline** and parked the feature here.

**What it becomes when built:** a screen where a visitor picks a **major** → sees the
schools that offer it, what graduates actually earn, cost/debt, and — the CareerStar
twist — **connects that major to occupation scores** via a CIP→SOC crosswalk. Turns
"this occupation is viable" into "here's the path to reach it, and whether it's worth
the debt." This was Ashley's original ROI/reachability idea.

**To revive:**
- The pipeline + data are in git history at commit **`212bbd2`** (`git show 212bbd2`).
  Restore `scripts/pipeline/build-universities.mjs` and re-run `build:universities`.
- Source CSVs (`data/sources/Most-Recent-Cohorts-*.csv`) are local/gitignored and
  still present on Ashley's machine.
- New work needed: a **CIP→SOC crosswalk** (majors→occupations) and a UI screen.

**Size:** 1 epic (data join + new screen + wiring). **Value:** high; distinctive.

---

## B-2 — Morningstar-style scorecard + "Bulls say / Bears say"

**Why deferred:** presentation polish; do it once the O\*NET-based scores are final so
the phrasing describes the *real* model.

**What it is:** lean harder into the "Morningstar for careers" identity Ashley is
already channeling:
- **Scorecard layout** — a compact, scannable card like Morningstar's stock report
  (headline rating, star/score, key metrics in a tight grid, "as of" date).
- **Bulls say / Bears say** — the signature Morningstar bullet framing, which maps
  *perfectly* onto CareerStar's return/risk split:
  - **Bulls say:** the pro-viability signals — strong BLS growth, high pay, strong
    interest/skill fit (now real O\*NET overlap).
  - **Bears say:** the risk signals — high AI exposure, constructed-volatility proxy,
    thin fit. Preserves "exposure ≠ displacement" in the bear phrasing.
- Generated **deterministically** from the score components (same discipline as the
  existing plain-English verdicts) — the LLM may phrase, never decide.

**To build:** a `bullsAndBears(occ, components)` function beside `verdict.ts`, rendered
in a redesigned `ScoreCard`. Natural pairing with the deterministic verdict layer that
already exists.

**Size:** 1–2 stories (logic + card redesign). **Value:** high; strengthens the
recruiter-facing "Morningstar for careers" story cheaply.

**When:** best done *after* the O\*NET fit rebuild lands, so Bulls/Bears cite the real
fit signal, not the keyword proxy.
