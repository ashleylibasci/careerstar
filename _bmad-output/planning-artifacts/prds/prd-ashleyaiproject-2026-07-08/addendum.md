# Addendum — CareerStar PRD

Technical-how and downstream detail that doesn't belong in the capability-level PRD.

## Technical approach (for architecture)

- **Frontend:** Next.js/React (reuse of author's existing stack from the stock-engine project). Single-page, one primary screen.
- **Scoring layer:** deterministic model over a preprocessed, occupation-keyed dataset. Language TBD (Python for data/model ergonomics vs. TS to keep one stack) — decide in architecture.
- **LLM layer:** explanation/personalization only; latest capable Claude model. Reads model outputs + cited data, renders plain-English "why" and redirect rationale. Never computes the score.
- **Data pipeline:** one-time/manual preprocess joining labor + skills + exposure datasets on occupation codes into a static artifact the app reads; no live DB needed for MVP.
- **Deploy:** AWS; app likely at a subdomain/path off `ashleylibasci.com` (root = personal portfolio).
- **Security (FR6) implementation notes:** prompt-injection mitigations (input validation, instruction/user-content separation, output constraints), rate limiting (per-IP/session), secrets via server-side env/secret store, HTTPS + least-privilege IAM + security headers.

## Lineage & story

- Direct successor to the author's **AI Stock Recommendation Engine** (Next.js, predictive models, risk profiles, sector filters, back-testing). Same shape: inputs → model → personalized, cited rating.
- Interview narrative: "rated stocks by risk → rebuilt the pattern to rate careers on risk-adjusted return, grounded in labor + AI-exposure data, hardened against prompt injection, built with an agentic AI workflow."

## Data sources (validated by grounding research)

| Source | Use | Access | License |
|---|---|---|---|
| **BLS** Employment Projections / OEWS | growth + pay | Bulk download (preferred) or API v2 (free key, ~500/day) | Public domain; attribute, no-endorsement |
| **O*NET** v30.x | skills/tasks (fit) | Bulk DB ZIP or Web Services | **CC BY 4.0** — visible attribution to US DOL/ETA |
| **Eloundou et al. 2023** "GPTs are GPTs" | AI exposure (risk) | `occ_level.csv`, github.com/openai/GPTs-are-GPTs | **MIT** — commercial OK, keep notice |

_Frey & Osborne 2013 was considered and dropped: copyrighted with no reuse license, pre-generative-AI, and methodologically contested. Eloundou is the sole AI-exposure source for v1._

- **Join key:** standardize on **SOC 2018**; use the **O*NET-SOC ↔ SOC crosswalk** (ships with O*NET). Version mismatch (2010 vs 2018) will drop occupations — budget a crosswalk step.
- **Exposure measures (Eloundou):** alpha = E1, beta = E1 + 0.5·E2, gamma = E1 + E2; both GPT-4 and human-annotator ratings available.
- **Volatility:** no public source — must construct a proxy (scenario dispersion / revision size / industry concentration).
- Key URLs: bls.gov/emp/data/occupational-data.htm · onetcenter.org/database.html · github.com/openai/GPTs-are-GPTs

## Rejected alternatives (from brief)

Investing/money app (regulatory risk); generic career helper (too vague); career quiz only (commodity); pure LLM chatbot (thin wrapper — the whole point is to avoid this).
