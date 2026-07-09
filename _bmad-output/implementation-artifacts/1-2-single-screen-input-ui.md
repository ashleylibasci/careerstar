---
baseline_commit: 9dbee30
---

# Story 1.2: Single-screen input UI

Status: review

<!-- Second story of Epic 1 (Live Walking Skeleton). Builds on Story 1.1 scaffold. Replaces the default Next.js page. -->

## Story

As a visitor,
I want one clean screen with a free-text box and a submit action,
so that I can enter my interests and the career paths I'm weighing.

## Acceptance Criteria

1. **Given** I open the site, **When** the page loads, **Then** I see a single-screen CareerStar layout: a product title/headline, a short subhead explaining what it does, one labeled free-text input (multi-line), and a submit control.
2. **Given** the input, **When** I use a keyboard only, **Then** the input and submit are reachable via Tab, have a visible focus indicator, and the input has an associated `<label>`.
3. **Given** different screen sizes, **When** I view on mobile and desktop, **Then** the layout is responsive and readable (no horizontal scroll, comfortable max width).
4. **Given** an empty input, **When** I look at the submit control, **Then** it is disabled until there is text (prevents empty submissions).
5. **Given** the default Next.js starter page, **When** this story is done, **Then** `app/page.tsx` no longer shows the scaffold welcome content — it shows the CareerStar input screen.

## Tasks / Subtasks

- [x] Task 1: Replace the default page with the CareerStar screen (AC: 1, 5)
  - [x] Rewrote `app/page.tsx` as the CareerStar landing/input screen (title, subhead, form + honest-framing note).
  - [x] Removed the default Next.js welcome markup and `next/image` logo usage.
- [x] Task 2: Build the input form as an accessible client component (AC: 1, 2, 4)
  - [x] Created `app/components/CareerForm.tsx` (`'use client'`) with a controlled `<textarea>` and submit button.
  - [x] Associated a visible `<label htmlFor>` with the textarea; added an example placeholder.
  - [x] Submit disabled while input is empty/whitespace.
  - [x] On submit: `preventDefault()`, placeholder handler only (no API/score) + a muted "scoring comes next" note.
- [x] Task 3: Styling, focus, and responsiveness (AC: 2, 3)
  - [x] Tailwind centered single-column layout, `max-w-xl`, comfortable padding.
  - [x] `focus-visible` rings on textarea and button; theme-aware via `bg-background`/`text-foreground`.
  - [x] Responsive; no horizontal scroll (constrained max width, `px-6`).
- [x] Task 4: Verify (AC: all)
  - [x] `npm run lint` passes.
  - [x] `npm run build` passes.
  - [x] `npm run dev` renders the CareerStar screen at `localhost:3000` (HTTP 200); default welcome page confirmed gone.

## Dev Notes

### Scope boundary (important)
- This story is **presentational only**: the input screen and a submit button. It does **not** call a backend, compute a score, or render results. The submit handler is a deliberate placeholder — **Story 1.3** adds `/api/score` and the placeholder result card, and **2.4** wires real scores.
- Keep copy honest and simple. Suggested headline: "CareerStar" with a subhead like "Rate the paths you're weighing — like stocks. Type your interests and the careers you're considering."

### Technical guidance
- **Client component required:** a controlled input needs React state, so the form must be a Client Component (`'use client'`). Keep `app/page.tsx` as a Server Component that renders the client form component (e.g. `app/components/CareerForm.tsx`), OR make the page itself a client component — either is fine; prefer extracting the form into `app/components/CareerForm.tsx` for cleanliness.
- **Tailwind v4** is already configured (`app/globals.css` imports it). Use utility classes; no extra CSS framework.
- **Accessibility:** `<label htmlFor>` tied to the textarea `id`; `focus-visible` ring utilities; button `disabled` state also conveyed visually (e.g. reduced opacity + `cursor-not-allowed`).
- Do not add new dependencies — everything needed ships with the scaffold.

### Files to touch
- `app/page.tsx` (UPDATE — replace default content)
- `app/components/CareerForm.tsx` (NEW — client form component)
- Possibly `app/globals.css` (only if a small base tweak is needed; prefer Tailwind utilities)

### Testing standards
- No business logic yet, so no unit tests required. The bar: `lint` + `build` pass and the screen renders with the form (manually verified via dev server). Real tests arrive with the scorer (Story 2.2).

### References
- [Source: epics.md#Epic-1-Story-1.2] — acceptance criteria.
- [Source: ARCHITECTURE-SPINE.md#AD-2] — UI only renders; no scoring logic in the UI.
- [Source: 1-1-scaffold-the-next-js-foundation.md] — established stack (Next.js 16 App Router, TS, Tailwind).

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (BMAD dev-story)

### Debug Log References

- None. Clean build; lint and build passed first try.

### Completion Notes List

- Replaced the default scaffold page with a single-screen CareerStar UI (headline, subhead, form, honest-framing note).
- Added `app/components/CareerForm.tsx` — accessible client form (labeled `<textarea>`, submit disabled when empty, `focus-visible` rings, `aria-live` status). Submit is a deliberate placeholder (no scoring) per scope; Story 1.3 wires `/api/score`.
- Updated `app/layout.tsx` metadata so the browser tab reads "CareerStar…" instead of "Create Next App".
- Verified all ACs via dev server: HTTP 200, page contains "CareerStar" + the input label, default welcome text gone. Lint + build pass.

### File List

- `app/page.tsx` (UPDATE — replaced default content with CareerStar screen)
- `app/components/CareerForm.tsx` (NEW — accessible client form)
- `app/layout.tsx` (UPDATE — metadata title/description)

### Change Log

- 2026-07-08: Built CareerStar input screen; all ACs verified; commit `b707b02`. Status → review.
