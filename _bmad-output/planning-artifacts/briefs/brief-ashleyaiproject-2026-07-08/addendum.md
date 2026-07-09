# Addendum — CareerStar

Supporting depth that belongs downstream (PRD / architecture) or doesn't fit the 1–2 page brief.

## Rejected alternatives & why

- **Investing / money app** — original idea; killed for a solo first app: real money, brokerage APIs, KYC, and SEC regulatory exposure. Too risky and slow for a summer resume project.
- **Generic "career paths" helper** — too vague to be a product; "helps with careers" is a category, not a spine. Sharpened into the *viability rating* instead.
- **Career quiz / matcher only** — a commodity; free versions everywhere, untrusted. The "is it reasonable" viability verdict is the actual value.
- **Pure LLM chatbot ("thin wrapper")** — actively hurts the resume signal; interviewers see many. Rejected in favor of a defensible quantitative model with the LLM only explaining.

## Origin & lineage

- Direct successor to Ashley's **AI Stock Recommendation Engine** (Next.js, predictive models, risk profiles, sector filters, back-testing; CS I Honors, Fall 2025). Same architecture (inputs → predictive model → personalized, back-tested rating), new domain.
- Unifies her two original brainstorm directions (investing + career guidance) into one: "how do I secure my future when the ground is shifting."

## Builder context (shapes feasibility & story)

- Rising sophomore, dual Math + CS + Data Science minor at UIUC; GPA 3.88. Strong math/stats foundation (Calc I–III, Linear Algebra, Intro Higher Math, Data Science) = the quantitative moat is genuinely within reach.
- Pre-algorithms (CS 225 Data Structures in progress Fall 2026) — argues for clean, tight engineering over algorithmically heavy features.
- Cybersecurity background (MIT Beaver Works 2024; current cybersecurity internship at Baxter Credit Union) — enables the data-trust/responsible-handling angle.
- Owns the AWS domain already; comfortable with Next.js/React/Node, Python, Java, C/C++, Kotlin.

## Candidate data sources (for architecture/PRD to validate)

- **BLS Occupational Outlook Handbook** — public, per-occupation employment projections.
- **O*NET** — public, structured occupation skills/tasks/knowledge data.
- **AI-exposure research** — Eloundou et al. "GPTs are GPTs" (occupation-level LLM exposure); Frey & Osborne (2013) automation-susceptibility baseline. Confirm citation/usage terms.
