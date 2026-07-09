# CareerStar

A data-grounded AI **career viability rating** — "Morningstar for careers." You type in your interests and the paths you're weighing, and CareerStar returns a **0–100 risk-adjusted score** per path (treating each career like a financial asset: expected return vs. AI/automation risk, adjusted for your fit), with a plain-English explanation and a redirect to a stronger adjacent path when one scores low.

Built with an AI-native workflow (BMAD) and a deterministic scoring model — the LLM explains the score, it never computes it.

## Tech stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **React 19**
- **Tailwind CSS**
- Deployed on **AWS Amplify** (planned)

## Getting started

Requires **Node.js 20+**.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint

## Project structure

```
app/            # UI + Route Handlers (App Router)
lib/
  scorer/       # deterministic scoring module (upcoming)
  security/     # input validation, rate limiting, prompt hardening (upcoming)
data/           # committed scoring dataset (upcoming)
scripts/
  pipeline/     # offline BLS + O*NET + Eloundou data join (upcoming)
```

Planning artifacts (brief, PRD, architecture, epics) live under `_bmad-output/planning-artifacts/`.
