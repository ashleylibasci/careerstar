# CareerStar — Accessibility & Mobile-Responsiveness Audit

Read-only audit of the CareerStar Next.js UI. Scope: `app/layout.tsx`, `app/page.tsx`,
`app/components/{CareerForm,ScoreCard,FrontierChart,CompareRadar}.tsx`,
`app/explore/{ExploreClient,page}.tsx`, `app/methodology/page.tsx`,
`app/architecture/page.tsx`, `app/globals.css`.

Findings are grouped High / Medium / Low. Each item cites the file/line, the concrete issue,
and a one-line fix. No code was modified.

---

## High

### H1 — Unlabeled form controls on /explore (WCAG 4.1.2 / 3.3.2 failure)
- **File:** `app/explore/ExploreClient.tsx` (search input L66–72; the three `<select>`s L73, L79, L86)
- **Issue:** The search `<input>` has only a placeholder (`"🔍 Search…"`) and no `<label>`/`aria-label`. The Field, Min-pay, and Sort `<select>`s have no associated label at all — a screen reader announces only "combobox" plus the current option. Placeholders are not accessible names.
- **Fix:** Add `aria-label="Search careers"` to the input and `aria-label="Filter by field" / "Minimum pay" / "Sort by"` to each select (or visually-hidden `<label>`s).

### H2 — Pervasive low-contrast muted text (WCAG 1.4.3 failure)
- **Files:** widespread — e.g. `CareerForm.tsx` L188/197/211/229/243/284/293/385/397, `ScoreCard.tsx` L48/98, `FrontierChart.tsx` L25/33/39/44/45, `CompareRadar.tsx` L45, `ExploreClient.tsx` L93/100, `architecture/page.tsx` L33/40/43/152/159, `page.tsx` uses `/70` (ok).
- **Issue:** Meaningful text uses `text-foreground/40` and `text-foreground/50`. On the white background `#171717` at 40% opacity is ≈ `#a3a3a3` → ~2.4:1 contrast; 50% ≈ ~3:1. Both fail the 4.5:1 minimum for normal-size text (and much of this text is 10–12px, i.e. below large-text thresholds). Also affects placeholder text (`placeholder:text-foreground/40`).
- **Fix:** Raise muted text to at least `text-foreground/60` (better `/70`) for any text conveying information, and verify against a contrast checker in both light and dark themes.

### H3 — Sticky top nav does not wrap → horizontal overflow at ~375px
- **File:** `app/layout.tsx` L34–42
- **Issue:** `<nav className="... flex items-center gap-x-5 ...">` plus an inner `flex gap-x-5` holds five items ("★ CareerStar", Home, Explore, Methodology, "How it's built") with no `flex-wrap`. At 375px with `px-6` padding the row cannot fit and either overflows horizontally or crushes/clips, breaking the sticky header on mobile.
- **Fix:** Add `flex-wrap` (and reduce gap on small screens, e.g. `gap-x-3 sm:gap-x-5`) so the nav reflows on narrow viewports.

### H4 — Sub-40px tap targets on chips and chip-remove buttons
- **File:** `app/components/CareerForm.tsx` — chip class L183–184 (`px-3 py-1 text-sm` ≈ 28px tall); remove buttons L254–261 / L267–275; interest toggle buttons L300–317.
- **Issue:** Chips and their inline "✕" remove buttons render ~24–28px tall — below the ~40px comfortable mobile target (they clear the 24px WCAG 2.5.8 floor but are cramped, and the ✕ hit area is a bare glyph). Hard to tap accurately on a phone.
- **Fix:** Increase padding to ≈`py-1.5 px-3` and give the remove button its own padding/min-size (e.g. `p-1 -mr-1` with `min-w`/`min-h` ~24–32px) so each control is ≥40px.

---

## Medium

### M1 — Interest toggle buttons don't expose selected state
- **File:** `app/components/CareerForm.tsx` L300–317
- **Issue:** Selection is conveyed only by background color + an `aria-hidden` "✓". The buttons carry no `aria-pressed`, so a screen reader cannot tell which interests are selected (color-only state, WCAG 1.4.1 / 4.1.2).
- **Fix:** Add `aria-pressed={on}` to each interest button (optionally wrap the group in `role="group"` with an accessible name).

### M2 — Table headers lack `scope`; no row header on /explore
- **File:** `app/explore/ExploreClient.tsx` L99–107 (header `<th>`s), L111–126 (rows)
- **Issue:** Column `<th>`s have no `scope="col"`, and the Career cell (L112) is a `<td>`, not `<th scope="row">`, so header/data associations are ambiguous for assistive tech.
- **Fix:** Add `scope="col"` to each header `<th>` and make the first body cell `<th scope="row">`.

### M3 — Heading order skips from h1 to h3
- **Files:** `app/page.tsx` (h1 L8) → `app/components/ScoreCard.tsx` (h3 L42); no intervening h2. Also FrontierChart/CompareRadar section titles are `figcaption`s, and "N paths scored" (CareerForm L352) is a `<span>`.
- **Issue:** On the home results view the heading level jumps h1 → h3, violating logical heading order (WCAG 1.3.1).
- **Fix:** Make the score-card title an `<h2>` (or introduce an h2 results heading, e.g. promote "N paths scored" to `<h2>`).

### M4 — Range slider has no human-readable value / description
- **File:** `app/components/CareerForm.tsx` L372–388
- **Issue:** The label is associated (`htmlFor="risk"`), but the slider value is a raw fraction (0–1, step 0.01). A screen reader announces "0.5" with no meaning, and the descriptive end labels ("A little…", "A lot…") are not linked.
- **Fix:** Add `aria-valuetext` reflecting the level (e.g. "Balanced") and/or `aria-describedby` pointing to the min/max caption element.

### M5 — "Your interests" label is orphaned (associated with nothing)
- **File:** `app/components/CareerForm.tsx` L292
- **Issue:** `<label className="...">Your interests</label>` has no `htmlFor` and wraps no control (the interests are a set of buttons), so it is a label pointing at nothing.
- **Fix:** Use a `<fieldset>`/`<legend>` around the interest buttons, or make it a heading/`<div>` — not a bare `<label>`.

### M6 — Emoji used as UI are not consistently hidden/text-backed
- **Files:** `layout.tsx` L35 (★ logo); `ScoreCard.tsx` L39 (★ "Best bet"), L69 (↗ redirect); `CareerForm.tsx` L360 (🔗/✓ on the copy button), L205 & `ExploreClient.tsx` L70 (🔍 in placeholders); `architecture/page.tsx` L41 (→ arrows).
- **Issue:** These glyphs are decorative but announced literally (e.g. "link Copy link", "black star CareerStar", "up-right arrow"). Note: the chip-remove ✕ (CareerForm L260/272) and interest ✓ (L314) are already handled — the ✕ buttons have proper `aria-label`s and the ✓ is `aria-hidden`. This finding is about the *remaining* decorative emoji.
- **Fix:** Wrap purely decorative glyphs in `<span aria-hidden="true">` (leave the text label as the accessible name).

---

## Low

### L1 — Decorative flow arrows and very small text on /architecture
- **File:** `app/architecture/page.tsx` — arrows L41, tiny type L33 (`text-[11px]`), L43 (`text-[9px]`), node titles L32 (`text-[13px]`).
- **Issue:** The "→" flow arrows are read aloud, and 9px labels are hard to read and low-contrast. Layout itself is fine — zones use `overflow-x-auto` inner scroll so nothing overflows the page.
- **Fix:** `aria-hidden` the arrows and bump the smallest labels to ≥11–12px.

### L2 — Redundant duplicate link to "/"
- **File:** `app/layout.tsx` L35 (logo) and L37 (Home) both `href="/"`.
- **Issue:** Two adjacent links to the same destination add navigation noise for screen-reader/keyboard users.
- **Fix:** Optional — keep the logo as home and drop or repurpose the "Home" link, or give the logo `aria-label="CareerStar home"`.

### L3 — No skip-to-content link
- **File:** `app/layout.tsx` (whole header/nav)
- **Issue:** Keyboard users must tab through the nav on every page; there is no "skip to main content" affordance.
- **Fix:** Add a visually-hidden-until-focused skip link targeting the page `<main>`.

### L4 — SVG charts labeled but data is visual-only
- **Files:** `FrontierChart.tsx` L28, `CompareRadar.tsx` L31
- **Issue:** Both SVGs correctly have `role="img"` + `aria-label` (good), but there is no `<title>`/`<desc>` and the underlying data points are not individually exposed. Acceptable because the same data appears in the score cards / table; noting for completeness.
- **Fix:** Optional — add `<title>` inside each SVG; the equivalent data is already available in text elsewhere.

### L5 — Body font overridden away from the loaded Geist font
- **File:** `app/globals.css` L22–26
- **Issue:** `body { font-family: Arial, Helvetica, sans-serif; }` overrides the `--font-geist-sans` variable wired up in `layout.tsx`. Not an a11y defect, but unintended and affects rendering consistency.
- **Fix:** Set `font-family: var(--font-sans), Arial, sans-serif;` (or remove the override).

---

## Verified OK (no action needed)
- **Charts grid stacks on mobile:** `CareerForm.tsx` L365 `grid gap-4 sm:grid-cols-2` → single column below 640px. Good.
- **Score-card bars stack:** `ScoreCard.tsx` L59 `grid-cols-1 ... sm:grid-cols-3`. Good.
- **Explore table wrapped in `overflow-x-auto`** (`ExploreClient.tsx` L97) so it scrolls rather than breaking the page. Good.
- **Filter row wraps** (`ExploreClient.tsx` L65 `flex flex-wrap`). Good.
- **Focus states:** search input, textarea, and primary CTA use `focus-visible:ring-2`; other buttons/links do not set `outline-none`, so the browser default focus ring is preserved (visible focus is not destroyed anywhere).
- **Error text** uses `aria-live="polite"` (`CareerForm.tsx` L341).
- **Form label associations** for `career-search` (L194) and `risk` (L372) are correct.
