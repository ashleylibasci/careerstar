# Epics 6 & 7 — Retro-Stories (shipped-without-a-story features)

These features were built during rapid iteration and shipped **before** being written
as stories. Per the 2026-07-09 board reconciliation
(`_bmad-output/planning-artifacts/reconciliation-2026-07-09.md`), they are recorded
here as proper retro-stories so the board is *complete*, not just honest — with
as-built acceptance criteria, files, and commits. All are `done` and verified live.

Grouping: **Epic 6** = exploration & interaction depth (the earlier "advanced/parallel/
broad" batches); **Epic 7** = the Morningstar rating layer (the 2026-07-09 session).

---

## Epic 6 — Advanced Analytics & Exploration (retro) — Status: done

### Story 6.1: Explore / leaderboard — Status: done
- **AC (as built):** a `/explore` page lists all ~730 occupations, filterable by field, min-pay, and education, sortable by viability/resilience/growth/pay/ROI; rows deep-link to a scored view. ✅
- `app/explore/{page,ExploreClient}.tsx`, `app/api/leaderboard/route.ts`, `app/api/occupations/route.ts`. Nav gained "Explore". Commits `068a6c6`, `3e89506`.

### Story 6.2: Career detail pages — Status: done
- **AC (as built):** `/career/[code]` shows an occupation's growth, pay, AI exposure, education/ROI, interests, and related careers, reachable from Explore rows and score cards. ✅
- `app/career/[code]/page.tsx`. Commit `3e89506` (later extended in Epic 7 with the ROI pathway).

### Story 6.3: Comparison charts — efficient-frontier scatter + radar — Status: done
- **AC (as built):** results render a return-vs-risk scatter ("careers as assets") and a multi-axis compare radar; both expandable to a full-screen modal. ✅
- `app/components/{FrontierChart,CompareRadar}.tsx`, maximize modal in `CareerForm`. Commits `c3157b0`, `068a6c6`, `b8c4a52` (later rebuilt interactive in Epic 7).

### Story 6.4: Model-tuning sliders (live sensitivity) — Status: done
- **AC (as built):** three weight sliders (growth↔pay, AI-risk γ, market↔fit α) re-score the rankings live; `/api/score` accepts a full `weights` override (back-compatible with the legacy `riskPriority`). ✅
- `app/components/CareerForm.tsx` (`weightsRef`, `tunedWeights`), `lib/scorer/scorer.ts` (`computeScores` weight overrides). Commit `fc68a03`.

### Story 6.5: Shareable links + downloadable report — Status: done
- **AC (as built):** the current comparison encodes to a URL (careers/fields/interests) that re-hydrates and re-scores on load; a print button produces a clean PDF of charts + cards. ✅
- `app/components/CareerForm.tsx` (URL params + clipboard; `window.print()` with `print:hidden`). Commits `c3157b0`, `fc68a03`.

---

## Epic 7 — The Morningstar Rating Layer (retro, 2026-07-09) — Status: done

### Story 7.1: Real O*NET capability fit — Status: done
- **AC (as built):** FIT is cosine similarity in a real 68-dimensional O*NET capability space (35 Skills + 33 Knowledge importance ratings), market-distinctiveness-weighted (per-dimension z-score) so rare defining capabilities dominate; the redirect is a true nearest-neighbor in that space. Retires the keyword-proxy "spec gap." ✅
- `lib/scorer/skills.ts` (lexicon, `cosine`, `fit`, `profileSimilarity`), `scripts/pipeline/build-data.mjs` (O*NET join, market stats), `lib/scorer/{scorer,redirect,types}.ts`, `lib/scorer/skills.test.ts`. Commit `3c7dc84`.

### Story 7.2: Sensitivity/robustness + construct validation — Status: done
- **AC (as built):** each comparison is re-scored across a deterministic 729-weighting grid (every weight ±20%); a Robustness panel reports per-career rank-stability + score band with an honest Robust/Close-call badge. The methodology page reports the exposure⊥growth validation (Spearman ρ≈0.08). ✅
- `lib/scorer/sensitivity.ts`, `app/components/RobustnessPanel.tsx`, `data.json meta.validation`, `app/methodology/page.tsx`. Commit `3c7dc84`.

### Story 7.3: Morningstar star rating — Status: done
- **AC (as built):** a relative, forced-curve star rating (top 10% → 5★, next 22.5% → 4★, …) computed live against all ~730 occupations under the current weights; half-star precision; tinted by the Strong/Mixed/Risky band. ✅
- `lib/scorer/rating.ts` (`starsFromPercentile`, `percentileOf`), `app/components/ScoreCard.tsx`, `app/api/score/route.ts`. Commit `dd1befc`.

### Story 7.4: Bulls say / Bears say — Status: done
- **AC (as built):** each card shows deterministic strongest-case and weakest-case bullets (top 2–3), ranked by signal extremeness, always ≥1 of each (even a 5★ career shows its softest spot). LLM may restyle wording, never the selection. ✅
- `lib/scorer/rating.ts` (`bullsAndBears`), `app/components/ScoreCard.tsx`. Commit `dd1befc`.

### Story 7.5: Education / ROI pathway — Status: done
- **AC (as built):** the career detail page answers "how do I get here, and is it worth the debt?" — median 1-yr earnings, typical debt, pay-to-debt ratio, feeder majors, and selective schools (admit rate/cost/grad pay) for the occupation, wired to the score by SOC so it can't orphan. ✅
- `scripts/pipeline/build-education.mjs` (College Scorecard + NCES CIP→SOC crosswalk → `data/education.json`), `data/sources/cip_soc.json`, `app/career/[code]/page.tsx`. Commit `f00609f`.

### Story 7.6: Accessibility & contrast pass — Status: done
- **AC (as built):** skip-to-content link, correct heading order, grouped/labeled interest controls, decorative glyphs hidden, the loaded Geist font, and WCAG-compliant muted-text contrast across the UI. ✅
- `app/layout.tsx`, `app/globals.css`, `app/components/CareerForm.tsx`, plus a contrast sweep across 7 files. Commits `de92046`, `9f5207d`. (Audit: `a11y-audit.md`.)

---

### Interactive-charts upgrade (folded into 7.x)
The Epic 6 charts were rebuilt in the 2026-07-09 session: numbered collision-free scatter
dots sized by score + shaded sweet-spot quadrant + hover tooltips; radar defaulting to 3
series with click-to-toggle + hover-spotlight; both with click-a-point → jump-to-card
(`CareerForm.focusCard`). Commit `dd1befc`.
