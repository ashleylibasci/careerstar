# CareerStar — Interview Talking Points

Every feature in this project exists to answer an interview question. This doc maps each one
to the question it invites, a 30-second answer, and where the code lives. (For the full
narrative, see the live [case study](https://main.d3ag7o87gtn2c8.amplifyapp.com/case-study).)

---

## "Walk me through the hardest bug you found."

**Answer:** My own methodology page. It claimed Fit was "O\*NET skill-vector similarity" — but
when I read my own data file, Fit was actually a keyword match. The page made a claim the code
didn't keep. I rebuilt Fit for real: a 68-dimensional O\*NET capability vector per occupation
(35 skills + 33 knowledge areas), cosine similarity, z-scored against the labor market. The
reconciliation that caught it is committed in the repo — verdict by verdict.

**Code:** `lib/scorer/skills.ts` · `_bmad-output/planning-artifacts/reconciliation-2026-07-09.md`

## "Why did plain cosine fail, and why did z-scoring fix it?"

**Answer:** Every professional job rates high on the common skills (critical thinking, active
listening), so raw cosine similarity was dominated by dimensions everyone shares — "math +
programming" ranked Accountants #1 and everything clustered at ~0.35–0.41. Z-scoring each
dimension against the market mean/std makes *distinctive* capabilities dominate: a match on a
rare skill counts more than a match on a universal one. Adding O\*NET Knowledge (Economics,
Engineering, Medicine…) fixed domain discrimination that Skills alone blurred.

**Code:** `lib/scorer/skills.ts` (`zNormalize`, `fit`)

## "How do you know your model is right?"

**Answer:** I don't — so I ship the uncertainty. Three mechanisms: (1) **robustness** — every
comparison is re-scored across 729 weightings (each weight ±20% on a fixed grid) and the UI
reports rank stability, flagging "close call" instead of overselling a shaky #1; (2) **five
rival models** — the same careers scored under different philosophies (ignore AI risk / moat
first / Sharpe-style ratio / naive 1/N control), with disagreement surfaced as the finding;
(3) **construct validation** — AI exposure and BLS projected growth are nearly uncorrelated
(Spearman ρ ≈ 0.075), so the risk axis carries information growth doesn't.

**Code:** `lib/scorer/sensitivity.ts` · `lib/scorer/models.ts` · `data.json meta.validation`

## "Your model says software developers have *no moat*. Defend that."

**Answer:** The moat rating is defensibility: `0.6·(1−exposure) + 0.4·distinctiveness`.
Software development has extreme LLM exposure in the Eloundou data — coding is the most
model-touchable activity there is — which crushes defensibility even though the skill profile
is distinctive. But exposure ≠ displacement: the *risk-adjusted score* still rates software
4.5★ because growth and pay are elite. The model separates "will AI touch this work" from
"is this career worth pursuing" — conflating those is exactly the mistake the doom-scores make.
I kept the uncomfortable call rather than tuning it away.

**Code:** `lib/scorer/moat.ts`

## "What did YOU build versus the framework or the LLM?"

**Answer:** Every number is a pure deterministic function I wrote: the scorer, the fit model,
the moat, the star curve, the sensitivity grid, the five models — all in `lib/scorer/`, all
unit-tested, zero ML libraries. The LLM's only job is optional phrasing of an already-computed
result; it never sees raw user text and no code path lets it produce a number. The data
pipeline (BLS + O\*NET + Eloundou + College Scorecard + two federal crosswalks) is offline,
reproducible, and committed.

**Code:** `lib/scorer/*` (30 tests) · `scripts/pipeline/*` · `lib/explain/explain.ts`

## "Why a forced curve for the stars?"

**Answer:** Because that's what makes Morningstar stars mean something: 5★ is "top 10% of the
universe," not "scored above 80." I percentile-rank each career against all 730 under the
user's current weights and apply the 10 / 22.5 / 35 / 22.5 / 10 curve. It also means the
rating honestly *moves* when you change your priorities — which is the thesis of the app.

**Code:** `lib/scorer/rating.ts` (`starsFromPercentile`)

## "How is the free-text/LLM surface secured?"

**Answer:** Defense by construction, not filtering: user text is parsed into structured
signals server-side and **never sent to the LLM at all** — the model receives only computed
numbers and a controlled tag vocabulary, so there's nothing to inject through. Plus
server-side validation and length caps, per-IP rate limiting (exactly 20/min, 429 +
Retry-After), security headers, and server-only secrets.

**Code:** `lib/security/*` · `lib/explain/explain.ts` · `next.config.ts`

## "You back-tested a career model? Walk me through it."

**Answer:** BLS blocks scripted downloads of archived projections, so I recovered the
**2014–24 vintage from the Internet Archive's 2016 snapshot** of BLS Table 1.2, scored the
2014 labor market with today's model, and compared against realized 2024 employment (the base
year of the current EP file) — 647 occupations joined across a real decade. Results, honestly:
the score tracked reality (Spearman ρ = 0.39; 48% of actual decliners flagged vs a 33% base
rate — a 1.45× lift), but the raw BLS projection alone was slightly better (ρ = 0.411),
because the **AI-risk adjustment added nothing for a pre-LLM decade** (exposure ρ ≈ 0.1) —
which is exactly the model's own claim: exposure is a forward-looking bet the past can't
score. The misses are published by name (the model liked oil-and-gas jobs in 2014; the oil
crash disagreed — a systemic shock no occupation-level model catches).

**Code:** `scripts/pipeline/build-backtest.mjs` · `data/backtest.json` · /methodology

## "What would you do differently / what's next?"

**Answer:** Ship it to real users and close the loop: the site logs "was this rating fair?"
votes (zero-PII), and the plan is to analyze where users disagree with the model and either
adjust it or defend it — both are wins. Longer-term: re-run the back-test on the 2024–34
vintage in 2034, which is the model betting on itself in public.

## Process footnote (if asked how it was built)

Solo, one summer, using a structured AI-native workflow (BMAD): brief → PRD → architecture →
epics → build loop, with an honest mid-project board reconciliation when the build outran the
plan. CI runs typecheck + lint + 30 tests + production build on every push.
