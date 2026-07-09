---
title: "CareerStar — Product Requirements Document"
status: final
created: 2026-07-08
updated: 2026-07-08
---

# CareerStar — PRD

`[working title]` · Solo summer 2026 portfolio project · Web app · Derived from the product brief (2026-07-08)

## 1. Overview

CareerStar scores the **viability** of career paths for CS/STEM students in an AI-shaped economy. It treats each path like a financial asset and returns a **0–100 risk-adjusted score** — grounded in real labor + AI-exposure data — with a plain-English explanation and, when a path scores low, a redirect to a stronger adjacent path. It is version two of the author's stock-recommendation engine, applied to careers instead of equities.

**Honest differentiation** (grounding research): the *0–100 AI-risk score* is a crowded, commoditized space (AIExposure, Future of Your Work, CareerSignal, and many quiz sites). CareerStar does **not** position on the risk score alone. Its defensible edges are (1) the **risk-adjusted "jobs as stocks" framing** — return vs. risk combined into one score — which no competitor surfaced; (2) the **redirect-to-adjacent-path** mechanic; and (3) the **fit-to-skills join**. The moat is the framing + adjacency engine + the defensible model, not the raw data.

## 2. Goals & success metrics

**Product goals**
- Turn free-text interests + candidate careers into a legible, defensible viability score per path.
- Make the *methodology* — not the LLM — the source of the verdict.
- Always pair a weak verdict with a constructive redirect.

**Success metrics**
- A first-time user gets a scored, explained result in a single screen, in `[ASSUMPTION]` < ~10 seconds.
- The score's components are visible and the explanation is understandable without a data background.
- **Real-world metric:** the live demo prompts an interviewer to ask "how does the score work?" — and the answer is a methodology.

**Counter-metrics (guardrails)**
- Never present a score as certainty; every result states its assumptions/limits.
- No low score is shown without a redirect (no dead-ends).

## 3. Target user

**Primary:** undergraduate CS/STEM students weighing a major/career under AI uncertainty — e.g. *Maya, a rising sophomore CS major who's read that AI will "kill coding jobs" and is quietly wondering if she picked wrong.* She wants an honest, grounded read, not a pep talk or a personality quiz. (May broaden to all students post-MVP.)

## 4. Primary user journey

**UJ-1 — "Is my plan reasonable?"**
1. Maya lands on one clean screen and types, in her own words, her interests and the paths she's considering ("I like math and problem-solving — thinking software engineering, data science, or quant").
2. She submits; the system parses her input into candidate career paths + interest/skill signals.
3. Within seconds she sees a **score card per path** (0–100), each showing the component breakdown (return / risk / fit) and a short plain-English "why."
4. For any low-scoring path, she sees a **redirect**: a higher-scoring adjacent path that reuses her strengths, with one line on why.
5. She can read the methodology/sources link to understand and trust the numbers.

## 5. Scope

**In (MVP):** free-text input → parsed career candidates → risk-adjusted scoring engine → score cards with breakdown + explanation + redirect → methodology/sources disclosure → a public static **"How it's built" / Architecture page** (FR7) → security-hardened, deployed web app.

**Out (v1):** accounts / saved history / auth; real financial or investment features; mobile app; exhaustive occupation catalog; social/sharing; monetization; multi-language.

## 6. Functional requirements

**FR1 — Input & interpretation**
- FR1.1 Accept a single free-text entry describing the user's interests and one or more candidate career paths.
- FR1.2 Parse the entry into (a) a set of candidate occupations mapped to a standard occupation taxonomy `[ASSUMPTION: SOC / O*NET-SOC codes]`, and (b) interest/skill signals for fit scoring.
- FR1.3 Handle ambiguous or unmatched input gracefully — ask to clarify or map to the nearest known occupation, never fail silently.

**FR2 — Scoring engine (core)**
- FR2.1 For each candidate occupation, compute a **0–100 risk-adjusted viability score** from three components: **expected return** (projected employment growth + compensation), **risk** (AI/automation exposure + field volatility), and **fit** (overlap of user interests/skills with the occupation).
- FR2.2 Combine components via a documented, deterministic model with explicit, author-chosen weights (a risk-adjusted / Sharpe-style formulation), reproducible for the same input.
- FR2.3 Expose the component sub-scores behind each total so the number is decomposable.
- FR2.4 Ground every component in cited source data (see FR5); no component may be produced by the LLM alone.
- FR2.5 **Volatility has no off-the-shelf source** — the risk component's volatility term must be a *constructed, documented proxy* (e.g. dispersion across BLS scenarios, size of historical projection revisions, or industry concentration), explicitly labeled as a modeling assumption.
- FR2.6 The risk component must preserve the distinction between **AI *exposure*** (share of tasks affected — what the source data measures) and **displacement** (jobs actually lost). The score and copy must never equate the two.

**FR3 — Results & explanation**
- FR3.1 Present one score card per candidate path: total score, component breakdown (visual), and a concise plain-English explanation of the result.
- FR3.2 Generate the explanation via an LLM layer that *reads the model's outputs and sources* and renders them in plain language — it explains, it does not decide the score.
- FR3.3 For any path below a defined viability threshold `[ASSUMPTION]`, surface a **redirect**: the highest-scoring adjacent path reusing the user's strengths, plus a one-line rationale.
- FR3.4 State result limitations inline (grounded estimate, not a prediction) and link to the methodology/sources.

**FR4 — Transparency & trust**
- FR4.1 Provide an accessible methodology/sources page: what data feeds each component, the weighting approach, and known limitations.
- FR4.2 Cite the underlying dataset(s) for each occupation's figures, with visible attribution where licenses require it (O*NET CC BY; BLS no-endorsement).
- FR4.3 Show **"data as of" dates** per source and state plainly what the score means and does not mean (a grounded estimate of exposure/viability, not a prediction of job loss). This directly mitigates the misinterpretation risk (§8).
- FR4.4 Disclose that free-text input is processed by a third-party LLM to generate explanations.

**FR5 — Data**
- FR5.1 Growth + compensation: **US BLS** Employment Projections / OEWS (public domain; bulk download preferred over the rate-limited API v2 for projections). Attribute BLS; imply no endorsement.
- FR5.2 Occupation skills/tasks for fit: **O*NET** (bulk DB v30.x or Web Services; **CC BY 4.0** — requires visible attribution to US DOL/ETA).
- FR5.3 AI-exposure for risk: **Eloundou et al. 2023 "GPTs are GPTs"** occupation-level scores (`occ_level.csv`, GitHub, **MIT** license; alpha/beta/gamma exposure measures, keyed to O*NET-SOC). This is the single AI-exposure source for v1 — Frey & Osborne 2013 was deliberately dropped (copyrighted/no license, pre-generative-AI, methodology contested).
- FR5.4 Standardize internally on **SOC 2018** codes; include an **O*NET-SOC ↔ SOC crosswalk** step to reconcile BLS (SOC) with O*NET/Eloundou (O*NET-SOC), or version mismatches will drop/misalign occupations.
- FR5.5 Preprocess/normalize sources into a joined, occupation-keyed static dataset the engine reads; refresh is manual for v1.

**FR6 — Security hardening** *(the differentiating layer)*
- FR6.1 Defend the LLM/free-text surface against **prompt injection** — sanitize/validate input; constrain the model so user text cannot override system instructions.
- FR6.2 **Rate limiting & abuse/cost control** on the input and any LLM-backed endpoint to prevent bill-running and misuse.
- FR6.3 **Secrets management** — no API keys or credentials in client code or the repo; server-side only, via a secrets mechanism.
- FR6.4 Secure deployment posture on AWS (HTTPS, least-privilege, sane headers) `[ASSUMPTION]`.

**FR7 — "How it's built" / Architecture page** *(portfolio-facing feature)*
- FR7.1 Provide a public page (its own route, e.g. `/architecture`) presenting CareerStar's system design — the offline data pipeline, the deterministic scorer, the LLM explanation layer, and the AWS deployment — understandable to a technical visitor (i.e. an interviewer).
- FR7.2 Show the key architecture decisions (the ADs) and, for each, *what it prevents* — surfacing the engineering reasoning, not just the boxes.
- FR7.3 The page is **static** — no user input, no data dependency, no LLM call — and decoupled from the scoring flow so it can never affect the core demo.

## 7. Non-functional requirements

- **NFR1 — Performance:** end-to-end result in `[ASSUMPTION]` < ~10s; the deterministic scoring portion is near-instant, the LLM explanation is the main latency.
- **NFR2 — Cost:** runs within a student/free-tier budget; LLM usage bounded per request and per session (ties to FR6.2).
- **NFR3 — Privacy:** stateless — no accounts, inputs not persisted beyond the request `[ASSUMPTION]`; stated plainly to the user.
- **NFR4 — Trustworthiness:** every score is decomposable and cited (see FR2.3, FR4); the product never overclaims certainty.
- **NFR5 — Usability/accessibility:** single-screen, understandable to a non-technical student; reasonable a11y (keyboard, contrast, labels).
- **NFR6 — Maintainability:** clean, documented code and a README fit for a portfolio reviewer; methodology reproducible.

## 8. Risks & open questions

- **Misinterpretation / ethical harm** *(highest-priority risk).* Telling a student a path is "unreasonable" is individually consequential. Precedent: Karpathy pulled his public AI-exposure dashboard over misinterpretation. Also, the science is contested (Frey-Osborne's "47%" is widely disputed) and **exposure ≠ displacement**. Mitigations: soft language (never "don't do X"), mandatory redirect (FR3.3), visible uncertainty/limits, clear "what this does/doesn't mean" (FR4.3), exposure-vs-displacement discipline (FR2.6).
- **Data licensing** — BLS (public domain), O*NET (CC BY 4.0), Eloundou (MIT) are all safe *with attribution*. (Frey & Osborne dropped precisely to avoid its no-license problem.)
- **Data staleness / horizon mismatch** — blends 2023 AI-exposure (Eloundou) with 2033 BLS projections; different horizons and definitions. Document assumptions and show "data as of" dates (FR4.3).
- **Volatility proxy** — the "risk" half has no off-the-shelf source and must be constructed and labeled (FR2.5).
- **Verdict credibility** — predictions are speculative; framing stays "grounded estimate with stated assumptions" (FR2.3, FR4, NFR4).
- **Scope creep** — the engine can balloon; the MVP cut in §5 is the discipline.
- **Open decisions:** final product name; scoring language (Python vs TS); exact viability threshold; exact weighting scheme (set during build and documented).

## 9. Out of scope / future

Accounts + saved comparisons; broader (non-STEM) audience; richer occupation catalog; user-adjustable weights ("what if I weight pay higher?"); back-testing dashboard showing how flagged fields actually trended; shareable result links.
