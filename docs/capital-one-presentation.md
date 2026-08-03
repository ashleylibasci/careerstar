# CareerStar — 15-Minute Presentation
### Capital One group · Wednesday, August 6, 2026 · Ashley Libasci

**The one-sentence pitch:** I built a model that rates careers the way you rate assets — then caught it lying, back-tested it against a real decade, and published where it was wrong.

**Audience calibration:** This is a finance-and-tech crowd. Risk-adjusted return, Sharpe, moats, model risk, 1/N — that's their day job. Don't explain the metaphor slowly; *use* it fluently and let them enjoy recognizing it. The engineering half of the room gets the BMAD/agentic-dev section; the finance half gets the math; everyone gets the war stories.

**Timing budget (13 min of content + 2 min buffer):**
| # | Slide | Time |
|---|-------|------|
| 1 | Title + hook | 0:45 |
| 2 | The problem | 1:00 |
| 3 | The product (screenshots) | 2:00 |
| 4 | The model — four lines | 2:00 |
| 5 | Model risk, made visible | 1:30 |
| 6 | The receipt: back-test | 2:00 |
| 7 | Moats + the uncomfortable call | 1:00 |
| 8 | How it was built: BMAD | 1:30 |
| 9 | Vibe coding vs. engineering | 1:00 |
| 10 | AWS under the hood + war story | 1:30 |
| 11 | Close: what I learned + the 2034 bet | 0:45 |
| — | Q&A backups | — |

---

## Slide 1 — Title (0:45)

**On slide:** CareerStar wordmark + tilted star · "Rate career paths like stocks." · ashleylibasci.com · Ashley Libasci — Math + CS, UIUC '27

**Say:** "Hi — I'm Ashley. This summer I built a ratings agency. Not for stocks — you have plenty of those — for *careers*. Every U.S. occupation gets a risk-adjusted 0-to-100 score, a star rating on a forced curve, and a moat classification. In fifteen minutes I'll show you the product, the math, the receipts, and the slightly unusual way it was built."

**Delivery note:** "I built a ratings agency" is the hook — pause half a beat after it.

---

## Slide 2 — The problem (1:00)

**On slide:** "Choosing a career is the biggest capital-allocation decision most people ever make. The standard advice is vibes."

**Say:** Students pick careers on anecdotes and fear — especially fear about AI. Meanwhile the data to do better is public: BLS employment projections, O*NET's skill profiles for 730 occupations, peer-reviewed AI-exposure research. Nobody had assembled it into the thing an analyst would actually want: one risk-adjusted number with the reasoning shown. Target user: my classmates — 19-year-olds deciding under AI uncertainty.

**Optional beat for this audience:** "You'd never buy an asset without a risk-adjusted view. Most people pick a 40-year career without one."

---

## Slide 3 — The product, in 90 seconds (2:00)

**On slide:** 3–4 screenshots (pre-captured, don't risk live wifi): ① /rate results with the verdict banner + score dials, ② the judge-switch flipping a ranking, ③ the career sky, ④ ⌘K palette.

**Say (walking the screenshots):**
- "You name careers or just your interests; every path gets a scored card — return, AI-resilience, fit — with a bulls-and-bears case, Morningstar style."
- "The ranking is scored by five rival models, and you can *switch judges live* — the Defensive judge flips software developers from #1 to last. That disagreement is a feature: it's model risk, made visible."
- "All 730 careers also render as a night sky — positions from UMAP over O*NET's 68-dimensional skill space; fields form constellations on their own, from the math."
- "And ⌘K jumps anywhere, because I got tired of clicking."

**If demo insisted on:** rate 'software developer vs registered nurse vs electrician', switch to Defensive, done. 60 seconds max, screenshots ready behind it.

---

## Slide 4 — The model: four lines of math (2:00)

**On slide (the actual equations, monospace):**
```
Return = 0.5·growthRank + 0.5·payRank        (percentile-ranked vs all 730)
Risk   = 0.7·AIexposure + 0.3·volatility
RAV    = Return · (1 − 0.6·Risk)             (risk-adjusted value)
Score  = 100 · [0.7·RAV + 0.3·Fit]
```

**Say — the design decisions, not just the formula:**
- **Percentile ranks** because you can't average a percent and dollars — and because a score should mean "versus every alternative you could pick," which is the actual decision.
- **Risk *discounts* return multiplicatively** — same logic as risk-adjusting a return. Subtraction would let a safe dead-end beat a risky rocket on safety alone. γ = 0.6 caps the damage: risk erases at most 60% of return, never all.
- **Fit** is real data, not a quiz: O*NET rates every occupation on 68 skill/knowledge dimensions; your interests map into the same space; matches on *rare* skills count more than matches on skills every job shares (z-scored distinctiveness).
- **The honest part** (say it before they ask): "These weights are priors, not fitted constants — there's no dataset of correct career choices to train on. Which is exactly why the next slide exists."

**Data sources (small print on slide):** BLS Employment Projections 2024–34 · O*NET 29.0 · Eloundou et al. 2023 (AI task exposure). Deterministic scorer — an LLM writes the plain-English explanations, but never computes a number.

---

## Slide 5 — Model risk, made visible (1:30)

**On slide:** the five judges in a row: Standard · Growth maximalist · Defensive · Sharpe-style · Naive 1/N — each with a one-line philosophy.

**Say:**
- "Since the weights are judgment calls, I refuse to show you one opinion. Every comparison is re-scored under **729 weight perturbations** (±20% grid) — results that don't survive are labeled *close call*, not sold as verdicts."
- "And five structurally different models score everything: a pure momentum model that ignores AI on purpose, a moat-first defensive model, a Sharpe-style efficiency ratio, and a naive equal-weight 1/N as the control — if the clever model can't beat 1/N, that's worth knowing." *(This room knows DeMiguel — let the 1/N land.)*
- "My flagship Top-20 list has a hard gate: a career makes it only with a wide moat *and* all five judges within a ±10 band. Nobody hand-picks it."

---

## Slide 6 — The receipt: a real decade (2:00)

**On slide:** the four back-test tiles: **ρ = 0.39** score-vs-realized · **48%** of actual decliners flagged (33% by chance) · median score 37 (decliners) vs 46 (growers) · exposure ρ ≈ 0.10 (expected ≈ 0).

**Say — this is the strongest 2 minutes; slow down:**
- "Claims are cheap, so I time-traveled. I recovered the **2014–24 BLS projections** — the file as it existed in 2016 — from the Internet Archive, scored 2014's labor market with today's formula, and graded it against **what actually happened by 2024**. 647 occupations joined."
- "Careers my model scored low in 2014 really did decline more. 48% of actual decliners were in my bottom third, versus 33% by chance."
- "Now the honest part, and I lead with it: **the raw BLS projection alone scored ρ = 0.411 — slightly better than my full model's 0.39** — because the AI-risk term added nothing for a pre-LLM decade. That's exactly what the model claims: exposure is a *forward-looking* bet that a backward test structurally cannot score. The back-test validates the machinery history can test, and says so about the part it can't."
- "And the back-test never feeds back into the weights — the moment you tune to the test, the test stops being evidence. Calibrating on 2014–24 would have set my AI-risk weight to zero — it would teach the model to delete the one thing it exists to say."

---

## Slide 7 — Moats + the uncomfortable call (1:00)

**On slide:** `defensibility = 0.6·(1−exposure) + 0.4·distinctiveness` → 🏰 wide (~21%) · 🛡 narrow (~49%) · none (~30%). Big callout: "Software developers: **no moat** — and I shipped that."

**Say:**
- "Borrowed straight from Morningstar: how defensible is this career against AI pressure? Low exposure is shelter; rare skills are walls."
- "The model makes calls I didn't enjoy: it gives my own target career — software development — **no moat**, extreme LLM exposure, while its risk-adjusted score stays high. I shipped the uncomfortable answer instead of tuning it away."
- "One more receipt, from this year: Anthropic's 2026 labor research built its observed-exposure measure **on the same Eloundou task ratings I use** — and found 97% of real Claude usage falls inside tasks that dataset rated feasible. Their empirical data independently validated my exposure input."

---

## Slide 8 — How it was built: BMAD (1:30)

**On slide:** the pipeline: **PRD → Architecture → Epics → Stories → Implementation → Adversarial review → Retrospective** · "My code reviews are a room full of arguing characters."

**Say:**
- "This was my first project using **BMAD** — a structured method for AI-driven development. Instead of chatting with one AI, you run a disciplined pipeline: a PM agent interrogates the requirements into a PRD, an architect agent locks invariants, work is broken into epics and stories, and a dev agent implements each story against its spec with tests."
- "The part that hooked me: **multi-persona review**. My changes get attacked by a cast — a Google-hiring-manager persona who asks what I'd be grilled on in interviews, a fact-checker who traces every published number to a file, a copy chief who deletes anything that sounds machine-written, a QA lead, a design critic. They argue *with each other*, and I judge."
- "Honest review: it was more fun than any workflow I've used — and the fun is load-bearing. Adversarial review you enjoy is adversarial review you actually run. The hiring-manager persona twice forced my back-test banner above the fold; the fact-checker made me recompute every statistic on the site from source."

**Anecdote if time:** "One reviewer caught my methodology page overclaiming — it said fit used skill-vector similarity before the vectors were actually wired in. I rebuilt fit with real O*NET vectors and then published the story of the catch. That correction is now the strongest section of my case study."

---

## Slide 9 — Vibe coding vs. this (1:00)

**On slide (two columns):**

| Vibe coding | This project |
|---|---|
| Prompt, paste, pray | Spec first: PRD → architecture → stories |
| Accept whatever runs | 35 deterministic tests, CI on every push |
| One agreeable AI | A panel of adversarial reviewers |
| LLM does the math | LLM **never** computes a number — pure scorer |
| Claims | Back-test, robustness grid, published CSV |
| Nobody owns it | I can defend every line and every weight |

**Say:** "AI wrote a lot of this code — I'm not pretending otherwise, and that's the point. The difference between vibe coding and engineering isn't whether AI typed; it's whether there's a spec before the prompt, tests after it, an adversarial pass before shipping, and a human who can defend every decision. Same tool, opposite discipline."

---

## Slide 10 — AWS under the hood + one war story (1:30)

**On slide:** simple diagram: GitHub → **Amplify Hosting** (build + SSR compute) → **CloudFront** edge → **Route 53** (ashleylibasci.com). Badge: "AWS Cloud Practitioner — in progress."

**Say:**
- "Deployment is AWS Amplify Hosting: push to main, Amplify builds the Next.js app, serves it through CloudFront's edge network, Route 53 holds the domain. Fully managed CI/CD — the whole pipeline is a git push. I'm studying for the Cloud Practitioner cert, and this project made the concepts concrete: managed services, shared responsibility, edge caching, DNS."
- **War story (tell it — it's the best 40 seconds of the infra section):** "My API rate limiter keyed clients on the *last* X-Forwarded-For hop — standard advice, since clients can forge everything to the left. In production: thirty rapid requests, **zero** rate-limit hits. Why? Amplify's internal router appends *CloudFront's own edge IP* after the viewer IP CloudFront appended — so every request looked like a brand-new client. The fix keys on the second-to-last hop, with a global cap as backstop, and there's a regression test pinning the exact header shapes. You don't learn that from a practice exam — you learn it from a proxy chain in production."

---

## Slide 11 — Close (0:45)

**On slide:** "What I learned" — 3 bullets + "The 2034 bet."

**Say:**
- "Three takeaways. One: **structure beats vibes** — in career choices and in AI-assisted engineering; the discipline is the same. Two: **honesty is a feature** — the pages where the model admits weakness are the pages people trust most. Three: **the tools got fun** — and fun discipline is discipline that actually happens."
- "Last thing: the model claims its AI-risk term is a forward-looking bet the past can't grade. So I've committed publicly: **in 2034 I re-run the back-test on the 2024–34 decade** and publish how my ratings aged — hits, misses, and all. Ratings agencies should eat their own cooking. Thank you — questions?"

---

## Q&A backup slides (have ready, don't present)

1. **"Why these exact weights?"** — Priors, stated as priors; sensitivity grid + five rival models + consensus gates instead of false precision. "I can't prove 0.7 is right, so I show what happens when it's wrong."
2. **"Is exposure just another word for decline?"** — No: across all 730, exposure and projected growth are nearly uncorrelated (ρ ≈ 0) — exposure carries information growth doesn't. Flat growth across exposure quartiles.
3. **"What about wages in the back-test?"** — 2015 wages aren't in the archived table; pay percentiles proxy from today's ranking (occupational pay order is highly persistent); a growth-only variant (ρ = 0.389) shows the proxy's effect is small. All disclosed on the methodology page.
4. **"Star ratings?"** — Forced relative curve, the authentic Morningstar move: top 10% → 5★, next 22.5% → 4★, etc., recomputed under the user's own weights.
5. **"Stack?"** — Next.js 16 / React 19 / TypeScript / Tailwind 4; ~35 unit tests on the scoring library; data pipeline scripts rebuild every dataset from raw sources; open CSV + code on GitHub.
6. **"What did the AI get wrong?"** — Plenty; that's why the review pipeline exists. Best example: the fit overclaim, caught in review, rebuilt properly, published as a case study.
7. **"Anthropic connection?"** — Shared upstream dataset (Eloundou et al.); their 2026 observed-usage research validated it (97% of real usage within feasible-rated tasks); their labor finding — a ~14% drop in job-finding rates for 22–25-year-olds entering exposed occupations — is exactly my audience's stakes.

## Delivery notes (from the room)

- **Wren:** One idea per slide, numbers huge, everything else small. Your site's aesthetic (cobalt star, mono numerals, night sky) *is* the deck theme — consistency reads as craft.
- **June:** Don't read slides. The slide states the claim; you tell the story. Contractions. Say "I got this wrong" at least twice — it's your best material.
- **Grumbal:** Screenshots over live demo. If you must demo, do it on a phone hotspot you tested that morning.
- **Priya:** When the toughest question lands, the move is never defense — it's "correct, and here's the number I published about that." You've already done the hard part.
- **Dana:** Practice once against a 13-minute timer. If you're over, cut from slides 3 and 8 — never from 6.
