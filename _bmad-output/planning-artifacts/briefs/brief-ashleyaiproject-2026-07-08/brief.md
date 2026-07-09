---
title: "CareerStar — AI Career Viability Rating — Product Brief"
status: draft
created: 2026-07-08
updated: 2026-07-08
---

# Product Brief — CareerStar `[working title — see Open Questions]`

_"Morningstar for careers." A data-grounded AI rating that treats each career path like a financial asset — scoring its **risk-adjusted viability** in an AI-shaped economy — and, when a path is weak, points to the adjacent door that's still open._

---

## 1. Why this brief exists (project context)

This is a **summer 2026 solo project** built to be the centerpiece of Ashley's resume, portfolio, and interview conversations for **more competitive internships in the 2027 cycle** (targets span top tech and finance/quant: Google, Microsoft, Amazon, Capital One, Morningstar, bulge-bracket finance).

That goal is a real design constraint, not a footnote. The product has two audiences:

- **The end user** — CS/STEM students weighing career paths under AI uncertainty.
- **The evaluator** — a recruiter/interviewer who will click the live demo for ~90 seconds and read the write-up. Every scoping decision must survive *their* scrutiny.

The build is also a **process showcase**: developed with the BMAD agentic workflow (PRD → architecture → sprints) and deployed on AWS, demonstrating AI-native engineering — with Ashley owning every line and every modeling assumption.

## 2. Problem

Students choosing (or second-guessing) a major and career path face a wall of uncertainty that AI has made sharper: *will this field still exist, will it pay, and can I realistically get there from where I am?* Existing tools fail them in two opposite ways:

- **Career quizzes** are free, everywhere, and untrusted — personality-vibes with no grounding in whether a path is actually *viable*.
- **General advice** ("follow your passion") won't look a 19-year-old in the eye and say a path is drying up.

Nobody gives an honest, *data-grounded* verdict on career **viability** — and then points to a realistic alternative.

## 3. Target users

- **Primary:** undergraduate **CS/STEM students** (initially peers like Ashley — UIUC and similar) anxious about AI's effect on their intended field who want an honest read before committing. May broaden to all students later.
- **The true success gatekeeper:** technical interviewers/recruiters evaluating the project.

## 4. Goals & success criteria

**Product success (MVP):**
- A user enters interests + candidate career paths (free text) and receives a clear, defensible **0–100 viability score** per path, a plain-language *why*, and an adjacent safer alternative.
- The verdict is grounded in real data and the methodology is transparent and explainable.

**Real success (the project's actual job):**
- An interviewer clicks the live URL, immediately gets it, and asks "how does the score work?" — and Ashley answers with a *methodology*, not "the AI decided."
- Ashley can tell a clean story: **v1 rated stocks → v2 rates careers**, built solo in a summer with an agentic workflow.
- Measurable proxy: `[ASSUMPTION]` project is live on her domain, has a strong README/write-up, and earns follow-up questions in interviews.

## 5. The solution

**CareerStar** takes a user's interests and the career paths they're weighing (**free-text input**) and returns, per path:

1. A **0–100 viability score** — how reasonable this path is to bet on, computed as a **risk-adjusted return** (see §7).
2. The **components behind it** — expected return (compensation + projected growth) vs. risk (AI/automation exposure + volatility) + fit-to-skills — so the number is legible.
3. A **plain-English explanation** of *why* (LLM layer on top of the model, not instead of it).
4. A **redirect** — if a path scores low, the adjacent path that scores higher and reuses the user's strengths. _(The ethical load-bearing wall: always show a door, never just a gavel.)_

No accounts, no saved history — a single clean screen (type → scored result cards).

## 6. The moat (what makes it not-a-wrapper)

The differentiator lives *under* the box: a **transparent, defensible quantitative model** Ashley designed and can justify. The LLM only *explains and personalizes*; it does not *decide*. This is what separates CareerStar from thin "I called an LLM" projects and is the single most interview-valuable part of the build.

Two edges reinforce it, both drawn from Ashley's actual background:
- **Math** — the scoring is a real financial-style model she can defend (weights, risk adjustment, sensitivity of assumptions).
- **Security** *(in scope — thin, high-signal layer)* — deliberately hardening the LLM/free-text attack surface: prompt-injection defense, rate limiting / abuse & cost protection, secrets management, and secure AWS deployment. This showcases Ashley's cybersecurity background, unifies her resume (security + AI + math in one project), and is the layer most other student builders will skip — making the project uniquely hers.

## 7. Methodology — "rate jobs like stocks" (the math)

Model each career path as a **financial asset** and compute a **risk-adjusted viability score (0–100)**:

- **Expected return** — projected employment growth (BLS) + compensation, normalized.
- **Risk** — AI/automation exposure + historical/structural volatility of the field.
- **Fit** — overlap between the user's stated interests/skills and the occupation's profile (O*NET).
- **Score** — a risk-adjusted combination (a Sharpe-ratio-style analogue: return per unit of risk), tuned by weights Ashley chooses and documents.

`[ASSUMPTION]` Candidate public data sources: **BLS Occupational Outlook** (growth), **O*NET** (skills/tasks), **AI-exposure research** (Eloundou et al. "GPTs are GPTs"; Frey & Osborne baseline). Methodology and assumptions published so the score is auditable. The stock-engine lineage (risk profiles, back-testing) carries directly over — the model can even be back-tested against how flagged fields have actually trended.

## 8. Scope

**MVP — one hard thing, done for real: the risk-adjusted rating engine.**
- Input: interests + a small set of candidate careers (free text).
- Output: scored cards with component breakdown, explanation, and one redirect each.
- Frontend: single clean screen, reusing the Next.js stack Ashley already knows.
- Security hardening: a thin, deliberate pass on the LLM/free-text surface (per §6) — in scope, not a feature pillar.
- Deploy: live on Ashley's domain (currently `ashleylibasci.com` — likely app at a subdomain/path so the root stays her personal portfolio site).

**Explicitly out of scope for v1** (keep it tight):
- User accounts / saved history / auth.
- Real financial/investment features (regulatory minefield — deliberately excluded).
- Mobile app, large occupation catalog, social/sharing features, monetization.

## 9. Technical approach (light — full design comes in architecture)

Next.js (reuse), a scoring layer in `[ASSUMPTION: Python or TS]`, static/public datasets loaded and preprocessed, an LLM API for the explanation layer, a security-hardening layer per §6, deployed on AWS. Built and documented through the BMAD workflow.

## 10. Risks & open questions

- **Credibility of a "viability" verdict.** The future is speculative; the honest framing is "grounded estimate with stated assumptions," not "prophecy." Over-claiming would sink both product and interview.
- **Ethical harm.** A low score can discourage a young person. Mitigated by the mandatory redirect + supportive framing.
- **Data availability & licensing.** Confirm exposure datasets are usable/citable; BLS and O*NET are public.
- **Scope creep.** The engine can balloon; discipline is the whole game.
- **Thin-wrapper trap.** If the model degenerates into "ask the LLM," the edge is gone.
- **Open decisions:** final product name (working title "CareerStar"); exact data sources and scoring language (to be settled in PRD/architecture).

## 11. Positioning / story

*"Freshman year I built an engine that rates stocks by risk and back-tested it. Then I got anxious about my own future in an AI economy — so I rebuilt the pattern to rate* career paths *the same way: each path as an asset, scored on risk-adjusted return, grounded in labor and AI-exposure data, with the math behind it I can defend — deployed and built with an agentic AI workflow."* One sentence that demonstrates pattern-recognition, quantitative rigor, product sense, and self-awareness at once.
