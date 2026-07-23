# CareerStar

[![CI](https://github.com/ashleylibasci/careerstar/actions/workflows/ci.yml/badge.svg)](https://github.com/ashleylibasci/careerstar/actions/workflows/ci.yml)

**Rate careers like stocks — a data-grounded, risk-adjusted viability score in an AI-shaped economy. Back-tested against a real decade: scored the 2014 labor market with today's model vs. what actually happened by 2024 (ρ = 0.39 across 647 occupations, 1.45× lift on actual decliners — misses published by name).**

Live: **https://ashleylibasci.com**

CareerStar treats each career the way a portfolio treats an asset: expected **return** (growth + pay) versus **risk** (AI exposure + volatility), combined into a single **0–100 risk-adjusted score** and adjusted for how well the path fits you. You type your interests and the paths you're weighing; you get a score card per path with a component breakdown, a plain-English explanation, and — when a path scores low — a redirect to a stronger adjacent path instead of a dead end.

A solo summer portfolio project by Ashley Libasci (Math + CS, UIUC).

---

## The problem

CS/STEM students are being told AI will "kill coding jobs," and the internet answers with quiz sites and single-number "AI risk scores" that feel arbitrary and offer no way forward. CareerStar's bet is different: viability isn't just risk, it's **risk-adjusted return** — a field can be exposed to AI and still be worth pursuing if its growth, pay, and fit are strong enough. The goal is an honest, decomposable read a student can actually reason about, not a pep talk and not a doom score.

## How it works — the scoring model

Every number comes from a **pure, deterministic scorer** (`lib/scorer/scorer.ts`). Growth and pay are percentile-normalized across the full occupation set, so a score always means "relative to every other career here."

```
Return = wGrowth·growth + wPay·pay
Risk   = wExposure·exposure + wVolatility·volatility
RAV    = Return · (1 − γ·Risk)                    (risk-adjusted return)
Score  = 100 · [ α·RAV + (1 − α)·Fit ]            (0–100)
```

Default weights (explicit and tunable on purpose): `wGrowth = wPay = 0.5`, `wExposure = 0.7`, `wVolatility = 0.3`, `γ = 0.6`, `α = 0.7`.

**Fit is real O\*NET similarity.** Each occupation carries a 68-dimensional capability vector — O\*NET 29.0 importance ratings for 35 *skills* + 33 *knowledge* areas. Your interests are mapped into the same space via a documented lexicon, and fit is the overlap, with each capability **weighted by how distinctive it is across the labor market** (a z-score per dimension) so a rare defining skill counts more than one every job shares. The redirect is a true nearest-neighbor in this space. (`lib/scorer/skills.ts`)

**Robustness is measured, not asserted.** Because the weights are a choice, every comparison is re-scored across **729 weightings** (each weight moved ±20% on a fixed grid); the UI reports how often each career keeps its rank and flags a *close call* when the top picks are within noise of each other. (`lib/scorer/sensitivity.ts`)

**Validation — exposure ≠ decline, in the data.** AI exposure and BLS projected growth are almost uncorrelated across all 730 occupations (Spearman ρ ≈ 0.08), so the risk axis carries information growth doesn't — which is *why* a risk-adjusted score beats ranking on growth alone.

**The LLM only explains; the deterministic model decides.** The scorer is the single source of truth for every figure. The LLM (Claude Haiku) is called server-side with the *already-computed* score, components, and cited data, and returns only the plain-English explanation and redirect rationale — no code path lets it produce or alter a number.

## Key features

- **Two-zone input** — describe your interests in free text *or* pick from structured fields; both feed the same engine.
- **~730 BLS occupations** with **synonym search** (job titles map through aliases to the right occupation).
- **Efficient-frontier scatter** (return vs. risk) plus a **compare radar** across paths.
- **Explore / leaderboard** view to browse and rank the full catalog.
- **Redirect to a stronger path** whenever a candidate scores low — never a dead end.
- **Confidence bands** on each score, widening with AI exposure and weak fit.
- **Live priority slider + robustness panel** — retune the weights and watch rankings shift, with a 729-weighting rank-stability check shown alongside.
- **Real O\*NET capability fit** — 68-d skill + knowledge vectors, market-distinctiveness-weighted.
- **Morningstar-style research reports** per career — relative star rating (forced curve over all 730), AI-moat rating, Bulls say / Bears say, style box, and an Education & ROI section (College Scorecard earnings/debt via a CIP→SOC crosswalk).
- **Five rival rating models** scored side-by-side (growth-maximalist, defensive, Sharpe-style, equal-weight control) — when they disagree, the app says so instead of pretending there's one true formula.
- **Open data** — the full 730-row ratings table is downloadable as CSV (CC BY 4.0) with an invitation to audit the math.
- **Shareable links** that encode a result.
- **Security hardening** — prompt-injection defense (free-text treated as data, not instructions), input length caps, and rate limiting on the LLM-backed route.
- **Deployed on AWS Amplify** with CI/CD.

## Data sources & honest limitations

- **Growth + pay:** U.S. BLS Employment Projections **2024–2034** (public domain).
- **AI exposure:** Eloundou et al. 2023, *"GPTs are GPTs"*, occupation-level exposure (MIT license).
- **Skills + knowledge:** O\*NET 29.0 Database (U.S. DOL/ETA, CC BY 4.0) — Skills & Knowledge importance ratings.

Deliberate honesty about what the score is and isn't:

- **Exposure ≠ job loss.** The AI-exposure data measures the *share of tasks* a model could affect, not jobs actually displaced. The score never equates the two.
- **Estimate ≠ prediction.** Every result is a grounded estimate with stated assumptions, not a forecast of anyone's future.
- **Fit is a defensible model, not a verdict.** It uses real O\*NET skill + knowledge vectors, but the interest→capability lexicon is hand-authored, so two quantitatively similar fields (e.g. finance and engineering) can score alike. Stated as a modeling choice, not ground truth.
- **Volatility is a constructed proxy.** No off-the-shelf volatility dataset exists, so a field projected to shrink is treated as more volatile — an explicit modeling assumption, not measured data.

## Tech stack

- **Next.js 16** (App Router) — UI and Route Handlers are the only backend
- **TypeScript** end-to-end
- **Tailwind CSS**
- **AWS Amplify** hosting with CI/CD

Stateless by design: no accounts, no database, no persistence of user input beyond the request.

## Run locally

Requires **Node.js 20+**.

```bash
npm install
npm run dev        # start the dev server → http://localhost:3000
npm test           # run the scorer unit tests
npm run build:data # rebuild data/data.json from the offline source pipeline
```

`npm run build` produces a production build. The data pipeline runs offline and commits a single static `data/data.json`; the runtime app only reads it.

## What I'd build next

(The original roadmap — an out-of-sample back-test, the education-ROI screen, and Bulls/Bears scorecards — has shipped; the back-test against the archived 2014–24 BLS vintage is now the headline. What's actually next:)

- **Close the user loop.** Every rating has a "was this fair?" vote wired to structured logs; aggregate the votes and publish whether real users think the model is fair — then let that feedback pressure the weights.
- **The 2034 self-bet.** Today's 2024–34 scores are committed to the repo; when reality catches up, re-run the back-test on this vintage and publish how the model did — including the AI-exposure axis, which the 2014–24 test showed was a forward-looking bet that hadn't paid off yet.
- **A shared-store rate limiter.** The current limiter is in-memory per serverless instance, which doesn't hold behind CDN fan-out; a shared store (e.g. DynamoDB/ElastiCache) would make the per-client cap real.
- **Refine the interest→capability lexicon.** The disclosed residual (finance ≈ engineering for quantitative interests) is a lexicon problem, not a vector problem.
