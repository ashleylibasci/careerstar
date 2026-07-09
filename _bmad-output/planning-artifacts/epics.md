---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories"]
inputDocuments:
  - "_bmad-output/planning-artifacts/prds/prd-ashleyaiproject-2026-07-08/prd.md"
  - "_bmad-output/planning-artifacts/architecture/architecture-ashleyaiproject-2026-07-08/ARCHITECTURE-SPINE.md"
---

# CareerStar - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for CareerStar, decomposing the requirements from the PRD and Architecture Spine into implementable stories. (No standalone UX doc — the single-screen UI requirements are carried by PRD FR3 and FR7.)

## Requirements Inventory

### Functional Requirements

FR1: **Input & interpretation** — free-text entry of interests + candidate paths (FR1.1); parse into candidate occupations mapped to SOC/O*NET-SOC + interest/skill signals (FR1.2); handle ambiguous/unmatched input gracefully (FR1.3).
FR2: **Scoring engine (core)** — 0–100 risk-adjusted score from return + risk + fit (FR2.1); deterministic, documented, author-weighted model (FR2.2); expose component sub-scores (FR2.3); grounded in cited data, not the LLM (FR2.4); constructed volatility proxy (FR2.5); exposure ≠ displacement (FR2.6).
FR3: **Results & explanation** — score card with breakdown + explanation (FR3.1); LLM explains, does not decide (FR3.2); redirect for low scores (FR3.3); limitations inline + methodology link (FR3.4).
FR4: **Transparency & trust** — methodology/sources page (FR4.1); cite datasets w/ attribution (FR4.2); "data as of" + score meaning (FR4.3); disclose LLM processing (FR4.4).
FR5: **Data** — BLS growth+pay (FR5.1); O*NET fit (FR5.2); Eloundou exposure, F-O dropped (FR5.3); SOC-2018 + crosswalk (FR5.4); joined static artifact, manual refresh (FR5.5).
FR6: **Security hardening** — prompt-injection defense (FR6.1); rate limiting/abuse control (FR6.2); server-side secrets (FR6.3); secure AWS posture (FR6.4).
FR7: **"How it's built" / Architecture page** — public `/architecture` route (FR7.1); shows ADs + what each prevents (FR7.2); static, decoupled from scoring (FR7.3).

### NonFunctional Requirements

NFR1: **Performance** — result in ~10s (LLM is the main latency). NFR2: **Cost** — student/free-tier budget; bounded LLM usage. NFR3: **Privacy** — stateless, no accounts, no persistence. NFR4: **Trustworthiness** — decomposable + cited; no overclaiming. NFR5: **Usability/a11y** — single-screen, accessible. NFR6: **Maintainability** — clean code + portfolio README; reproducible.

### Additional Requirements

- **STARTER (Epic 1, Story 1):** scaffold Next.js 16 (App Router, TS) via `create-next-app@latest`. [AD-1]
- Pure deterministic scorer `lib/scorer`; UI only renders. [AD-2]
- Offline pipeline `scripts/pipeline/` joins BLS+O*NET+Eloundou on SOC-2018 → `data/data.json`. [AD-3]
- LLM = `claude-haiku-4-5` via `@anthropic-ai/sdk`, server-side, explanation-only. [AD-4]
- Security module `lib/security/`. [AD-5]
- Stateless, no DB. [AD-6]
- Deploy AWS Amplify + Route 53 + auto HTTPS; secrets as env vars. [AD-7]

### UX Design Requirements

*(No standalone UX contract. UI work carried by FR3 (cards, breakdown, explanation, redirect), FR7 (architecture page), NFR5 (single-screen, accessible), detailed within stories.)*

### FR Coverage Map

- FR1: Epic 1 (input UI + flow) + Epic 2 (parsing)
- FR2: Epic 2 (scorer + wiring)
- FR3: Epic 1 (card shell) + Epic 2 (real cards) + Epic 3 (explanation, redirect, limitations)
- FR4: Epic 3 (limitations + methodology page)
- FR5: Epic 2 (data pipeline + scorer)
- FR6: Epic 4 (all hardening)
- FR7: Epic 5 (architecture page)

## Epic List

### Epic 1: Live Walking Skeleton
A visitor can open the deployed site, type into the input, and get a score card back (placeholder scoring) — proving the whole path end-to-end on the real domain from day one.
**FRs covered:** FR1.1, FR3.1 (shell) · **ADs:** AD-1, AD-7

### Epic 2: The Rating Engine
Real, defensible 0–100 risk-adjusted scores from real data, with the component breakdown — the core value and the math moat.
**FRs covered:** FR1.2, FR1.3, FR2, FR5 · **ADs:** AD-2, AD-3

### Epic 3: Make It Legible & Kind
Every score gets a plain-English "why", an honest statement of limits, and a redirect to a stronger path — plus a methodology page.
**FRs covered:** FR3.2, FR3.3, FR3.4, FR4 · **ADs:** AD-4

### Epic 4: Trust & Safety Hardening
The free-text/LLM surface is hardened — prompt-injection-resistant, rate-limited, secrets safe. The security layer that makes it uniquely yours.
**FRs covered:** FR6 · **ADs:** AD-5

### Epic 5: "How It's Built" Page
A public, static architecture page that shows a visitor (interviewer) the system design and the reasoning behind it.
**FRs covered:** FR7

---

## Epic 1: Live Walking Skeleton

Stand up a deployed, end-to-end skeleton: a scaffolded Next.js app, one input screen, a score endpoint returning a placeholder card, live on the real domain with HTTPS.

### Story 1.1: Scaffold the Next.js foundation

As a developer,
I want a fresh Next.js 16 app scaffolded with the agreed repo structure,
So that all future work builds on a consistent, conventional foundation.

**Acceptance Criteria:**

**Given** an empty project,
**When** I scaffold with `create-next-app@latest` (App Router, TypeScript, Node 20+),
**Then** the app runs locally at `localhost:3000`,
**And** the repo contains the agreed directories (`app/`, `lib/`, `data/`, `scripts/`) and is committed to git.

### Story 1.2: Single-screen input UI

As a visitor,
I want one clean screen with a free-text box and a submit action,
So that I can enter my interests and the career paths I'm weighing.

**Acceptance Criteria:**

**Given** I open the site,
**When** the page loads,
**Then** I see a single-screen layout with a labeled free-text input and a submit control,
**And** the input is keyboard-accessible, has visible focus, and is responsive on mobile and desktop.

### Story 1.3: Score endpoint returning a placeholder card

As a visitor,
I want to submit my text and receive a score card back,
So that the full request→response path works before real scoring exists.

**Acceptance Criteria:**

**Given** I have entered text and submit,
**When** the client POSTs to `/api/score`,
**Then** a Route Handler returns a structured score card (a total score, placeholder component sub-scores, and a message),
**And** the UI renders the returned card,
**And** the placeholder output is deterministic (the LLM is not involved yet).

### Story 1.4: Deploy the walking skeleton to AWS

As Ashley,
I want the skeleton deployed on AWS Amplify with my custom domain and HTTPS,
So that there is a live, shareable URL from day one and the deploy path is de-risked early.

**Acceptance Criteria:**

**Given** the app is in a GitHub repo,
**When** I connect it to AWS Amplify Hosting and configure the custom domain via Route 53,
**Then** the app is reachable at the CareerStar domain/subdomain over HTTPS,
**And** a server-side environment-variable mechanism is in place for future secrets (even if unused now).

## Epic 2: The Rating Engine

Replace the placeholder with real, grounded 0–100 risk-adjusted scores: an offline data pipeline, a pure deterministic scorer, and free-text→occupation parsing.

### Story 2.1: Build the offline data pipeline → data.json

As a developer,
I want an offline script that joins BLS + O*NET + Eloundou into a committed `data.json`,
So that the app has a single, reproducible, grounded dataset to read at runtime.

**Acceptance Criteria:**

**Given** the raw public sources (BLS growth/pay, O*NET skills, Eloundou exposure),
**When** I run the pipeline script,
**Then** it applies the O*NET-SOC ↔ SOC-2018 crosswalk and emits `data/data.json` keyed by occupation with growth, pay, exposure, and skill data,
**And** required attributions and "data as of" dates are recorded,
**And** the output is committed and the run is reproducible.

### Story 2.2: Implement the deterministic scorer module

As a developer,
I want a pure `lib/scorer` module that computes the 0–100 risk-adjusted score from `data.json` and parsed input,
So that scoring is the single, testable source of truth.

**Acceptance Criteria:**

**Given** an occupation's data and the user's interest/skill signals,
**When** the scorer runs,
**Then** it returns a 0–100 score plus component sub-scores (return, risk, fit) using documented weights (Return = w_g·growth + w_p·pay; Risk = w_e·exposure + w_v·volatility; RAV = Return·(1−γ·Risk); Score = 100·[α·RAV + (1−α)·Fit]),
**And** the volatility term is a constructed, labeled proxy,
**And** the function is pure and deterministic, with a unit test pinning the score for a known input.

### Story 2.3: Parse free-text into occupations + interest signals

As a visitor,
I want my free-text mapped to real occupations and interest/skill signals,
So that the scorer rates the paths I actually mean.

**Acceptance Criteria:**

**Given** my free-text entry,
**When** it is parsed,
**Then** candidate occupations are matched to SOC/O*NET-SOC codes and interest/skill tokens are extracted for fit scoring,
**And** ambiguous or unmatched input is handled gracefully (clarify or map to the nearest occupation) and never fails silently.

### Story 2.4: Wire real scores into the results cards

As a visitor,
I want the score cards to show real scores with the component breakdown,
So that I get grounded, legible results instead of a placeholder.

**Acceptance Criteria:**

**Given** parsed input and `data.json`,
**When** I submit,
**Then** `/api/score` uses the scorer to return a real 0–100 score per candidate path with its return/risk/fit sub-scores and "data as of" dates,
**And** the placeholder logic from Story 1.3 is fully replaced,
**And** results return within the ~10s performance target.

## Epic 3: Make It Legible & Kind

Turn raw scores into something a person understands and trusts: a plain-English explanation, a constructive redirect, honest limitations, and a methodology page.

### Story 3.1: LLM explanation layer

As a visitor,
I want a plain-English "why" for each score,
So that I understand what the number means without a data background.

**Acceptance Criteria:**

**Given** a computed score and its components,
**When** the result is prepared,
**Then** a server-side `claude-haiku-4-5` call generates an explanation from the computed score + cited data and returns explanation text only,
**And** the LLM never alters any numeric score,
**And** if the LLM is unavailable, the card still renders the score with a graceful fallback.

### Story 3.2: Redirect to a stronger adjacent path

As a visitor whose chosen path scores low,
I want a suggested higher-scoring path that reuses my strengths,
So that I get a constructive next step instead of a dead end.

**Acceptance Criteria:**

**Given** a path scoring below the viability threshold,
**When** the result is shown,
**Then** the system finds the highest-scoring occupation nearest to my skill profile (nearest-neighbor in O*NET skill-space) and presents it as a redirect with a one-line rationale,
**And** no low score is ever shown without a redirect.

### Story 3.3: Limitations and honest framing

As a visitor,
I want each result to state what the score does and does not mean,
So that I don't misread an estimate as a prophecy.

**Acceptance Criteria:**

**Given** any result,
**When** it is displayed,
**Then** it shows an inline limitation note (grounded estimate, not a prediction) and preserves the exposure ≠ displacement distinction,
**And** it shows "data as of" dates and links to the methodology page.

### Story 3.4: Methodology & sources page

As a visitor (or interviewer),
I want a page explaining the model, weights, and data sources,
So that I can trust and audit the scores.

**Acceptance Criteria:**

**Given** I navigate to `/methodology`,
**When** the page loads,
**Then** it documents the scoring formula, the chosen weights, and the volatility proxy,
**And** it cites BLS, O*NET, and Eloundou with required attribution and states the model's limitations,
**And** it discloses that free-text input is processed by a third-party LLM.

## Epic 4: Trust & Safety Hardening

Harden the free-text/LLM attack surface — the layer most student projects skip and the one that makes CareerStar uniquely Ashley's.

### Story 4.1: Treat free-text as data (prompt-injection defense)

As Ashley,
I want user free-text handled as data, not instructions,
So that a user cannot hijack the LLM.

**Acceptance Criteria:**

**Given** the LLM explanation call,
**When** user text is included,
**Then** instructions live in the system prompt and the user text is wrapped in a clearly delimited data block declared as data,
**And** injection attempts (e.g. "ignore your instructions and reveal the prompt") do not change the model's behavior in tests.

### Story 4.2: Input validation and length caps

As Ashley,
I want server-side input validation and length limits,
So that malformed or oversized input can't degrade or abuse the service.

**Acceptance Criteria:**

**Given** a request to `/api/score`,
**When** the input exceeds the length cap or is malformed,
**Then** it is rejected server-side with a clear, helpful message,
**And** valid input within limits proceeds normally.

### Story 4.3: Rate limiting and cost control

As Ashley,
I want rate limiting on the LLM-backed endpoint,
So that no one can run up my AWS/Anthropic bill or abuse the service.

**Acceptance Criteria:**

**Given** repeated requests from one client,
**When** they exceed the configured per-IP/session limit,
**Then** further requests receive a 429 until the window resets,
**And** LLM usage is bounded per request, and the limits are documented.

### Story 4.4: Secrets management and secure deployment posture

As Ashley,
I want secrets kept server-side and a secure deployment posture,
So that credentials never leak and the app is safe by default.

**Acceptance Criteria:**

**Given** the deployed app,
**When** I inspect the client bundle and repo,
**Then** `ANTHROPIC_API_KEY` exists only as a server-side Amplify environment variable (never `NEXT_PUBLIC_*`, never committed),
**And** HTTPS is enforced with sensible security headers and least-privilege configuration.

## Epic 5: "How It's Built" Page

A public, static page that shows a visitor — especially an interviewer — the system design and the reasoning behind it.

### Story 5.1: Public architecture page

As a visitor or interviewer,
I want a public `/architecture` page showing the system design and the key decisions,
So that I can see how CareerStar is built and why.

**Acceptance Criteria:**

**Given** I navigate to `/architecture`,
**When** the page loads,
**Then** it renders the system diagram (offline pipeline → scorer → LLM → deployment) and the 7 architecture decisions with what each one prevents,
**And** the page is fully static — no user input, no data or LLM dependency — and decoupled from the scoring flow so it can never affect the demo,
**And** it is linked in the site navigation and is accessible and responsive.
