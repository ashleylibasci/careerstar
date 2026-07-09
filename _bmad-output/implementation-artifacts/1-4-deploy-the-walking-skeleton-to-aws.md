---
baseline_commit: 6dfb409
---

# Story 1.4: Deploy the walking skeleton to AWS

Status: review

<!-- LIVE at https://main.d3ag7o87gtn2c8.amplifyapp.com — homepage 200, /api/score works, 400 validation works. Custom domain (Part D) optional/pending. -->
liveUrl: https://main.d3ag7o87gtn2c8.amplifyapp.com

<!-- Fourth story of Epic 1. Interactive — requires the user's GitHub auth and AWS account/console. -->

## Story

As Ashley,
I want the skeleton deployed on AWS Amplify with my custom domain and HTTPS,
so that there is a live, shareable URL from day one and the deploy path is de-risked early.

## Acceptance Criteria

1. **Given** the app is in a GitHub repo, **When** I connect it to AWS Amplify Hosting and configure the custom domain via Route 53, **Then** the app is reachable at the CareerStar domain/subdomain over HTTPS.
2. **Given** the deploy, **When** it builds, **Then** Amplify auto-builds the Next.js app on push (CI/CD) and serves the live input screen + working `/api/score` endpoint.
3. **Given** future secrets, **When** configured, **Then** a server-side environment-variable mechanism is in place (Amplify env vars) — even if unused now.

## Tasks / Subtasks

- [ ] Task 1: GitHub auth (USER — interactive) (AC: 1)
  - [ ] Run `gh auth login` in the terminal (choose GitHub.com → HTTPS → login via browser). This is interactive and must be done by Ashley.
- [ ] Task 2: Create the GitHub repo and push (AC: 1)
  - [ ] `gh repo create ashleylibasci/careerstar --public --source=. --remote=origin --push` (public so it doubles as a portfolio artifact).
  - [ ] Confirm `main` is pushed and `node_modules` is not tracked.
- [ ] Task 3: Connect AWS Amplify Hosting (USER — AWS console) (AC: 1, 2)
  - [ ] AWS Console → Amplify → "Deploy an app" → GitHub → authorize → select `ashleylibasci/careerstar`, branch `main`.
  - [ ] Accept the auto-detected Next.js build settings (build output `.next`); start the build.
  - [ ] Verify the app is live at the default `*.amplifyapp.com` URL, including `/api/score`.
- [ ] Task 4: Custom domain via Route 53 (USER — AWS console) (AC: 1)
  - [ ] Amplify → Hosting → Custom domains → add `careerstar.ashleylibasci.com` (subdomain) — Amplify provisions the TLS cert and DNS records via Route 53 automatically.
  - [ ] Confirm HTTPS works at the custom domain.
- [ ] Task 5: Env var mechanism (AC: 3)
  - [ ] In Amplify → app settings → environment variables, confirm the mechanism exists (add `ANTHROPIC_API_KEY` later in Epic 3; not needed now). Never expose as `NEXT_PUBLIC_*`.

## Dev Notes

### Why this story is different (hands-on)
- This is the one story that **cannot be fully automated by the AI agent**: it needs Ashley's interactive `gh auth login`, her GitHub account, and actions in her AWS Console (Amplify + Route 53). The agent can run the git/gh push steps *after* auth; the AWS console steps are Ashley's, with the agent guiding and verifying.

### Guidance (verified current, mid-2026)
- **Amplify Hosting** natively supports Next.js 16 SSR (runs on Lambda + CloudFront). Connect repo → auto-detected build → deploy on every push.
- Because `ashleylibasci.com` is in **Route 53**, Amplify integrates the custom domain natively and provisions **HTTPS automatically**.
- Recommended: put the app at a **subdomain** (`careerstar.ashleylibasci.com`) so the root domain stays free for Ashley's personal portfolio.
- Fallback if Amplify lags Next.js 16 at build time: OpenNext/SST (still AWS) — does not change any architecture decision (AD-7).

### Prerequisites / risks
- `gh` CLI is installed but not authenticated (checked earlier). Node 20+ satisfied.
- Disk space was ~full earlier — ensure headroom before local builds.
- Repo is public → double-check no secrets are committed (none currently; `.env*` is gitignored).

### References
- [Source: epics.md#Epic-1-Story-1.4] — acceptance criteria.
- [Source: ARCHITECTURE-SPINE.md#AD-7] — AWS Amplify + Route 53 + auto HTTPS; secrets as env vars.

## Dev Agent Record

### Agent Model Used

_(to be filled by dev-story — partial; AWS console steps are user-performed)_

### Debug Log References

### Completion Notes List

### File List

### Change Log
