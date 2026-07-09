---
type: board-reconciliation
date: 2026-07-09
author: reconciled during CareerStar party-mode session
inputs:
  - _bmad-output/planning-artifacts/epics.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - git history (main @ 212bbd2) + working tree
purpose: >
  Honest reconciliation of the BMAD board against the code that actually
  shipped. The board says all 17 stories are "review" and nothing is "done";
  the code has moved several generations past several of those stories and
  grown features that have no story at all. This document tells the truth
  about both, rather than backporting the stories into a clean-looking lie.
---

# CareerStar — Board Reconciliation (2026-07-09)

## Why this document exists

The sprint board (`sprint-status.yaml`) shows **all 17 stories at `review`, zero `done`, every retrospective `optional/unrun`.** Meanwhile the working tree contains a live app that has:

- **extended** several stories well past their acceptance criteria,
- **superseded** at least one story outright, and
- **grown ~10 features that were never written as stories.**

Rather than quietly editing the old stories so the board looks tidy, this reconciliation records what each story *claimed*, what the code *is*, and where the two diverge. The scope drift is real and mostly good work — but it should be *named*, not hidden. The one thing we will not do is mark a story `done` against acceptance criteria the shipped code no longer matches.

**Method:** read each story's ACs in `epics.md`; traced them to the shipped modules/routes; ran the test suite (13 pass / 0 fail); inspected `data/data.json` meta and the drift commits (`068a6c6`, `c3157b0`, `3e89506`, `fc68a03`, `b8c4a52`, `212bbd2`).

---

## Verdict legend

| Verdict | Meaning |
|---|---|
| ✅ **Matches** | Shipped code satisfies the AC as written. Safe to close `done`. |
| ➕ **Extended** | AC satisfied *and* the code went materially beyond it. Close `done`, but the story no longer fully describes the feature. |
| ♻️ **Superseded** | The story's deliverable was intentionally replaced by later work. Close as `done (superseded by …)`. |
| ⚠️ **Verify-live** | Cannot be confirmed from the repo alone (deploy / live LLM). Needs a live check before `done`. |
| 🟥 **Spec gap** | Shipped code diverges from what the PRD/architecture promised. Not a bug — an honesty item to disclose. |

---

## Story-by-story reconciliation

### Epic 1 — Live Walking Skeleton

| Story | Claimed | True verdict | Notes |
|---|---|---|---|
| **1.1** Scaffold Next.js | review | ✅ Matches | `app/ lib/ data/ scripts/` all present; runs; committed. |
| **1.2** Single-screen input UI | review | ➕ Extended | AC = "one free-text box + submit." Shipped = a **two-zone structured input** (career/field synonym search → color chips + interests + free text), **live model-tuning sliders**, **shareable links**, and a **print button**. Still single-screen & accessible, so AC holds — but the story massively understates the feature. |
| **1.3** Placeholder score endpoint | review | ♻️ Superseded | Placeholder scoring was deliberately replaced by the real scorer in **2.4**. Close as `done (superseded by 2.4)`. |
| **1.4** Deploy to AWS Amplify + Route 53 + HTTPS | review | ⚠️ Verify-live | Server-side env-var mechanism is in place (`.env.local.example`, key read server-side). The *live deploy* (custom domain, HTTPS) cannot be confirmed from the repo. **Only story that needs an external check to close.** |

### Epic 2 — The Rating Engine

| Story | Claimed | True verdict | Notes |
|---|---|---|---|
| **2.1** Offline pipeline → data.json | review | ➕ Extended | `scripts/pipeline/build-data.mjs` emits `data/data.json` with **730 occupations** (full BLS EP 2024–2034 + Eloundou), meta carries sources/licenses/"data as of." Beyond the original scope. **See 🟥 Spec gap below** re: O*NET. |
| **2.2** Deterministic scorer | review | ➕ Extended | Formula shipped exactly (`WEIGHTS`, `computeScore`, `computeScores`) with a pinned unit test. **Beyond AC:** `verdict.ts` adds score bands + plain-English verdicts; the scorer now also accepts **caller-supplied weights** (powers the tuning sliders). |
| **2.3** Parse free-text → occupations + signals | review | ➕ Extended | `parse.ts` + tests; synonym search over BLS alt-titles added on top. |
| **2.4** Wire real scores into cards | review | ✅ Matches | `/api/score` → scorer → `ScoreCard` renders real score + return/risk/fit + "data as of." Placeholder gone. |

**🟥 Spec gap (Epic 2 — disclose, don't hide):** The PRD/architecture and Stories 2.2 / 3.2 describe **Fit as O\*NET skill-vector overlap** and the redirect as **nearest-neighbor in O\*NET skill-space.** The shipped `data.json` meta says plainly: *"Interest tags derived from SOC major group + title keywords (**not O\*NET skill vectors**)."* So Fit is a **keyword/major-group proxy**, not the O\*NET vector model that was promised. The math is honest and deterministic — but the **methodology page must not claim O\*NET skill vectors it doesn't use.** This is the single most important thing to make truthful before a recruiter reads it.

### Epic 3 — Make It Legible & Kind

| Story | Claimed | True verdict | Notes |
|---|---|---|---|
| **3.1** LLM explanation layer | review | ⚠️ Verify-live | `lib/explain/explain.ts` (Haiku, explanation-only, graceful fallback) present. Needs a live run **with a key** to confirm end-to-end, but fallback path renders without one. |
| **3.2** Redirect to stronger path | review | ➕ Extended / 🟥 | `redirect.ts` + tests ship and work — but "nearest-neighbor in O\*NET skill-space" is really nearest in the keyword/major-group space (same gap as above). Works; wording must match reality. |
| **3.3** Limitations & honest framing | review | ✅ Matches | Exposure ≠ displacement preserved in `ScoreCard` / methodology; "data as of" shown. |
| **3.4** Methodology & sources page | review | ✅ Matches | `/methodology` documents formula, weights, volatility proxy, sources. **Action:** update it to reflect the O\*NET gap and the new robustness work (Step 2). |

### Epic 4 — Trust & Safety Hardening

| Story | Claimed | True verdict | Notes |
|---|---|---|---|
| **4.1** Treat free-text as data (injection defense) | review | ⚠️ Verify-live | System-prompt / delimited-data-block pattern in `explain.ts`; needs a live injection test to confirm behavior. |
| **4.2** Input validation & length caps | review | ✅ Matches | `lib/security/limits.ts`. |
| **4.3** Rate limiting & cost control | review | ➕ Extended / ⚠️ | `lib/security/rate-limit.ts` present. **Caveat to disclose:** an in-memory limiter does not hold across serverless cold starts / multiple instances on Amplify — fine for a demo, worth a one-line honest note rather than an overclaim. |
| **4.4** Secrets & secure posture | review | ⚠️ Verify-live | Key is server-side by design; confirm **no `NEXT_PUBLIC_*` leak** in the built client bundle and that security headers are set. |

### Epic 5 — "How It's Built"

| Story | Claimed | True verdict | Notes |
|---|---|---|---|
| **5.1** Public architecture page | review | ✅ Matches | `/architecture` renders the pipeline→scorer→LLM→deploy diagram + the 7 ADs; static, decoupled, linked in nav. |

---

## Scope drift — features shipped with **no story**

These are real, mostly-good features that grew outside the plan. Naming them is the point.

| Feature | Where | Status | Call |
|---|---|---|---|
| **Explore / leaderboard** | `app/explore/*`, `/api/leaderboard`, `/api/occupations` | Live | Keep — write a retro-story. |
| **Career detail pages** | `app/career/[code]/page.tsx` | Live | Keep — write a retro-story. |
| **Compare radar** | `app/components/CompareRadar.tsx` | Live | Keep. |
| **Efficient-frontier scatter** | `app/components/FrontierChart.tsx` | Live | Keep — strong "math" visual. |
| **Maximizable charts (modal)** | scatter/radar (`b8c4a52`) | Live | Keep. |
| **Model-tuning sliders (live re-score)** | `CareerForm.tsx` (+ weights through `/api/score` → scorer) | Live | **Keep + elevate.** This is a *nascent sensitivity analysis* — Step 2 builds on it, doesn't start from zero. |
| **Shareable links** | `CareerForm.tsx` (URL params + clipboard) | Live | Keep. |
| **Print / PDF button** | `CareerForm.tsx` (`window.print()`) | Live | Keep (note: it's browser print-to-PDF, not a generated PDF — don't oversell). |
| **Education / ROI layer** | `lib/education.ts`, `lib/fields.ts` | Live (wired into career pages) | Keep. |
| **University pipeline (top ~200 schools)** | `scripts/pipeline/build-universities.mjs`, `data/universities.json` (461 KB) | 🟠 **Orphaned** | **`universities.json` has no consumer — nothing imports it.** Either wire it into a screen or don't ship the data. Dead data reads worse to a reviewer than an absent feature. |

---

## Honest verdict per epic

- **Epic 1** — Effectively done; **1.4 needs a live deploy check**, 1.2 far exceeds its story.
- **Epic 2** — Engine is real, tested, and the math is sound; **carries the O\*NET spec gap** that must be disclosed on the methodology page.
- **Epic 3** — Legibility shipped; wording needs to catch up to the actual Fit model.
- **Epic 4** — Hardening present; **three items need a live verify** and the rate-limiter deserves an honest caveat.
- **Epic 5** — Done.

## What this says about the process (the part worth keeping)

The drift isn't failure — it's a solo builder shipping fast with an AI-native loop and outrunning her own board. The valuable, honest story for a reviewer is exactly this: *"I tracked where the build diverged from the plan, told the truth about a spec gap in my own model, and reconciled it — instead of pretending the board was clean."* That reads as engineering maturity, not mess.

## Recommended board actions

1. **Close the clean ones now** (`done`): 1.1, 1.3 *(superseded)*, 2.4, 3.3, 3.4, 4.2, 5.1.
2. **Close `done` but tag "extended beyond story":** 1.2, 2.1, 2.2, 2.3.
3. **Run one live verification pass**, then close: 1.4, 3.1, 4.1, 4.4 (+ confirm rate-limit caveat for 4.3).
4. **Fix the 🟥 O\*NET wording** on `/methodology` (Step 3) — highest-priority honesty fix.
5. **Decide the orphaned `universities.json`:** wire it or drop it. No third option.
6. **Write retro-stories** for the 10 drift features so the board stops lying by omission (fold into the Epic retrospective).
7. Proceed to **Step 2 (sensitivity + back-test)** — building on the existing tuning sliders — then **Step 3 (narration)**.
