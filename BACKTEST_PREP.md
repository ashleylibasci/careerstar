# Back-test — ✅ DONE (no download needed after all)

**Status: complete, 2026-07-10.** BLS blocks scripted downloads of live files, but the
2014–24 projections vintage was recovered from the **Internet Archive's 2016-06-05 snapshot
of BLS Table 1.2** (`ep_table_102.htm`) — parsed into
`data/sources/bls_projections_2014_24.csv` (819 detailed occupations).

## What was built

- `scripts/pipeline/build-backtest.mjs` (`npm run build:backtest`) → `data/backtest.json`
- Joined **647 occupations** across the decade (2014 vintage × realized 2024 employment,
  which is the base year of the current EP file already in the repo).
- Published on `/methodology` ("The back-test: 2014 → 2024") and in the case study
  ("The receipt"), with the misses named.

## The results (honest version)

| Metric | Value | Meaning |
|---|---|---|
| Spearman ρ, 2014 score vs realized change | **0.39** | The score genuinely tracked a real decade |
| Decliner hit rate (bottom-tercile flag) | **48%** vs 33% base | 1.45× lift on the careers that actually shrank |
| Median 2014 score, decliners vs growers | **37 vs 46** | Decliners looked worse in advance |
| Raw BLS projection vs realized | **0.411** | Slightly better than the composite — see below |
| AI exposure vs realized (2014–24) | **0.099** | ≈ zero, as expected for a pre-LLM decade |

**The honest headline:** the growth/pay engine validated against history; the AI-risk
adjustment added nothing *for that decade* — which is exactly the model's own claim
(exposure is a forward-looking bet). The back-test validates what history can test and is
explicit about what it can't.

**Named misses** (in `data/backtest.json`): 2014's oil-and-gas roles scored well and then
fell ~50% in the price crash — a systemic shock no occupation-level model catches; couriers
were under-rated and grew +166% on e-commerce. Some extreme outliers reflect SOC
reclassification rather than real change.

## Caveats (also in `backtest.json` meta)

- 2015 wages absent from the archived table → pay percentile proxied by today's pay ranking
  (occupational pay *order* is highly persistent); growth-only variant computed alongside
  (ρ = 0.389 — nearly identical, so the proxy isn't doing the work).
- SOC-2010 → SOC-2018 joined on matching codes only; reorganized occupations drop out.
