# CareerStar

**Rate careers like stocks — a data-grounded, risk-adjusted viability score in an AI-shaped economy.**

Live: **https://main.d3ag7o87gtn2c8.amplifyapp.com**

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

**The LLM only explains; the deterministic model decides.** The scorer is the single source of truth for every figure. The LLM (Claude Haiku) is called server-side with the *already-computed* score, components, and cited data, and returns only the plain-English explanation and redirect rationale — no code path lets it produce or alter a number.

## Key features

- **Two-zone input** — describe your interests in free text *or* pick from structured fields; both feed the same engine.
- **~730 BLS occupations** with **synonym search** (job titles map through aliases to the right occupation).
- **Efficient-frontier scatter** (return vs. risk) plus a **compare radar** across paths.
- **Explore / leaderboard** view to browse and rank the full catalog.
- **Redirect to a stronger path** whenever a candidate scores low — never a dead end.
- **Confidence bands** on each score, widening with AI exposure and weak fit.
- **Live priority slider** — retune the weights and watch the rankings shift in real time (built-in sensitivity analysis).
- **Shareable links** that encode a result.
- **Security hardening** — prompt-injection defense (free-text treated as data, not instructions), input length caps, and rate limiting on the LLM-backed route.
- **Deployed on AWS Amplify** with CI/CD.

## Data sources & honest limitations

- **Growth + pay:** U.S. BLS Employment Projections **2024–2034** (public domain).
- **AI exposure:** Eloundou et al. 2023, *"GPTs are GPTs"*, occupation-level exposure (MIT license).

Deliberate honesty about what the score is and isn't:

- **Exposure ≠ job loss.** The AI-exposure data measures the *share of tasks* a model could affect, not jobs actually displaced. The score never equates the two.
- **Estimate ≠ prediction.** Every result is a grounded estimate with stated assumptions, not a forecast of anyone's future.
- **Fit is a rough signal.** Interest/fit tags are derived from SOC major group and title keywords, not O*NET skill vectors — a directional match, not a precise one.
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

- Real O*NET skill-vector fit in place of tag-based matching.
- A back-testing view showing how flagged fields actually trended after prior projections.
- Saved comparisons and richer occupation coverage beyond the STEM-focused set.
- A published methodology page walking through the weights and their trade-offs.
