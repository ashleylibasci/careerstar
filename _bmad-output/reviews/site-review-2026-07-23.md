# Full-site review — 2026-07-23

Three-lens pass over the live site (https://main.d3ag7o87gtn2c8.amplifyapp.com):
Priya 🧑‍💼 (recruiter signal), Sally 🎨 (UX audit), Marisol 🧪 (QA sweep, curl-based, local suite 32/32 green).

## Merged priority list

### Fix first — claims vs. reality gaps (the brand is "claims match the code", so these cost triple)

1. **LLM explanation path is dead in production** (Priya #1). Three live `/api/score` calls all returned byte-identical deterministic-fallback notes with no LLM latency — `ANTHROPIC_API_KEY` missing on Amplify or the call fails silently (`catch { return new Map(); }` in lib/explain/explain.ts). Site says "every score is explained"; case study says "Claude writes the why." Fix the key or disclose it's off; add a `source: "llm"|"fallback"` field so silent breakage is visible.
2. **ashleylibasci.com serves the app but all metadata points at Amplify** (Marisol #2, Priya #7). robots.txt on the custom domain advertises the amplifyapp sitemap; all 758 sitemap URLs + every og:url are amplifyapp.com; zero canonical tags. Set metadataBase to the public domain; update architecture page ("Route 53 — planned") + footer.
3. **Glued words on /case-study** (Marisol #3). Rendered text: "nothingfor", "adjustedscore", "right?My" — the known eats-space-after-inline-JSX bug at app/case-study/page.tsx:161,183,190. Three `{" "}` edits on the recruiter page.
4. **Stale README** (Priya #2). "What I'd build next" lists the back-test, education ROI, and Bulls/Bears as future work — all shipped and headlined. Also: GitHub repo has no description/topics/website set.
5. **"Selective schools" list on /career/15-1252.00 is visibly wrong** (Priya #4). Pomona/CMC/USC/Northeastern Oakland but no MIT/Stanford/CMU/Berkeley/UIUC. Root cause in build-education.mjs: "selective" = SAT_AVG present (excludes test-optional elites) + pool capped at first 60 in file order. Fix the pool or cut the section.
6. **Estimated-vector disclosure never reaches career pages** (Priya #5). Methodology promises the 25 estimated SOC codes are flagged; the software-developers page (an estimated one) shows moat/fit/neighbors with no flag. One disclosure line fixes it.

### Product / UX — high

7. **Home page buries the search box** (Sally H1). h1 → subhead → cred line → jargon-dense back-test card ("rank correlation ρ = 0.39") → PageExplainer → then the form; ~a full mobile viewport of recruiter material before the student's one action. Move the proof card below the form or collapse to one line.
8. **Search box fails silently three ways** (Sally H2). No form/Enter handling (Enter does nothing); no-match typing shows nothing (no "no results" row); button disabled with no explanation; no combobox aria/keyboard support. Enter-selects-top-match + a "no matches → browse all 730" row + combobox semantics.
9. **Four rating signals, two scales, opposite directions** (Sally H3). SW devs: 4.5★ + "top 14%" (relative) next to "Mixed" + 58/100 (absolute). Caption the scales ("★ vs. all 730 careers") + one reconciling sentence in the header.
10. **Score changes silently between pages** (Sally H4). 73 (personalized, home) → 58 (neutral baseline, career page); explanation only inside a collapsed PageExplainer. Always-visible "Neutral baseline — yours may differ" line.
11. **Parser interleaves unasked-for careers above the asked-for ones** (Priya #3). "software developer and registered nurse" → nurse anesthetists/practitioners/midwives ranked above both requested careers. Pin exact matches; show siblings in a labeled "adjacent paths" band.
12. **Live rate limiting doesn't fire** (Marisol #1). 30 rapid POSTs → zero 429s; per-instance buckets + last-XFF-hop behind CloudFront likely give every request a fresh bucket. Only GLOBAL_MAX backstop is real. Verify the XFF hop in CloudWatch or move to a shared store — matters more once the LLM key is live (paid calls).

### Medium

13. "Fit 50" shown when zero interests given — render "add interests to unlock" instead (Sally M1).
14. Dark-mode contrast: purple-700/emerald-700 chips + amber tone text lack `dark:` variants, ~3:1 on near-black (Sally M2).
15. Stars render 3 different ways; /explore rounds 4.5→5; /field/29 shows 20 identical "★ 5.0" rows (Sally M3).
16. Top-20 explainer example "±3" doesn't exist in the data — all 20 rows are ±9/±10, i.e. the list sits at the edge of its own conviction gate. Use a real row + one honest sentence (Sally M4, Priya #9).
17. Cards say "Resilience" (higher=better), FrontierChart axis says "Risk" — same quantity, opposite polarity (Sally M5).
18. /explore first paint: "0 shown" over empty table, no loading state (Sally M6).
19. Chart-expand modal: no Esc, no focus trap (Sally M7).
20. Dead end after results — no cross-links to /explore, /sky, /top-20 at peak engagement; "Sky" nav label opaque (Sally M8, Priya #8: case study is last of 7 nav items, 3 near-synonym meta links; add "Hiring? The 3-minute case study →" pointer, move 'The honest part' up).
21. Nav crowds at 640–780px; hamburger 36px (<44 tap target) (Sally M9).
22. Career pages: career-specific og:image but generic og:title/og:url — mismatched share cards (Marisol #4).
23. Bare SOC `/career/15-1252` 404s; redirect to `.00` (Priya #6, Sally L4, Marisol #5).
24. Scenario mode: verdict note says exposure 87 while breakdown says 100 under aiAdoption≠1 — plainVerdict uses unadjusted exposure (Marisol #7).

### Low / nits

25. opengraph-image returns identical 200 PNG for garbage codes (Marisol #6).
26. No Content-Security-Policy header (other security headers all present) (Marisol #8).
27. "Download report" = window.print(); relabel "Print / save as PDF" (Sally L1).
28. ≤12px text at /45–/55 opacity below AA; sweep to /60+ (Sally L2).
29. Tooltip-only model formulas unreachable on touch (Sally L3).
30. Sky mobile: tiny hit targets, no keyboard path to careers; UMAP params could be one `<details>` deeper (Sally L5).
31. Explore headers not click-to-sort (Sally L6); copy-link silent failure (L7); robustness "#1–#2 · #1 in 86%" needs micro-legend (L8); empty-input error says "and" should be "or" (L9).
32. Case study "32 unit tests" vs TALKING_POINTS "30" — one source of truth (Priya #9).
33. "Prompt-injection-proof" → "resistant by construction" (Priya #9).
34. Unknown-codes-only API error says "couldn't match your text" (Marisol #9); /api/feedback accepts 200KB bodies (#10); 404 title generic (#11).
35. Hero "★ 730 careers" uses generic star not the tilted brand star (Sally, brand nit).

### Verified clean (don't re-test)

All routes 200/404/405/308 correctly; sitemap 758 URLs, samples 200; CSV 730 rows clean; API abuse (malformed/oversized/proto-pollution/hostile weights/XSS reflections) all handled; visible-text scan of 11 pages free of undefined/NaN/glue except the 3 case-study spots; moat counts internally consistent; local suite 32/32; brand rollout consistent incl. 404 + print.

### What's strongest — don't dilute (Priya)

The honestly-read back-test (raw BLS beat the model, ρ .411 vs .39, misses named), the reconciliation story (receipted in the public repo), and auditability-as-posture (formulas, CSV download, sensitivity, live security headers). Marisol's verdict: **ship-with-notes**.

---

## Appendix: full reports

(Reports preserved verbatim below.)

### Priya 🧑‍💼 — hiring-manager review (verbatim)

I spent my ten minutes the way I actually would: home page, the nav, the case study, methodology, the flagship career page (software developers — the one every CS recruiter checks), the GitHub repo, and I hit the API directly three times to see the product work. Verdict up front: the intellectual core of this project is genuinely strong — stronger than most senior-engineer side projects I screen — but there are four places where the site's claims and its reality diverge, and divergence is exactly what I probe for in interviews. Fix those and this is a top-decile artifact.

1. **The LLM explanation path is dead in production — and the site doesn't know it.** I POSTed to /api/score three times with different inputs. Every note returned was byte-identical to the deterministic fallback template in lib/scorer/verdict.ts, and responses came back in 1.2–1.9s — no LLM latency. Per app/api/score/route.ts:127-139, that means explainResults() is returning empty: either ANTHROPIC_API_KEY isn't set on Amplify or the call fails silently (catch { return new Map(); } in lib/explain/explain.ts). The hero says "every score is explained, not guessed." The case study says "Claude writes the why." The one AI feature of an "AI-native" project does not run on the live site — and the graceful fallback means nobody noticed. Fix the prod key; add a health signal (a source: "llm" | "fallback" field). If it's off deliberately for cost, say so on the site — that would actually be on-brand. Interview question it invites: "Show me the LLM working in prod. How would you know if it silently broke?"

2. **The README contradicts the site — stale by an entire shipped milestone.** README.md line 5 headlines the back-test (ρ = 0.39, 647 occupations). Then "What I'd build next" (lines 89-94) lists as future work: "a true out-of-sample back-test," the College Scorecard ROI screen, and Bulls/Bears cards — all three are live today. Also: the GitHub repo has no description, no topics, no website link set. Rewrite the roadmap with actual next steps (the 2024–34 self-bet from TALKING_POINTS is a great one). Interview question: "Your README says the back-test is future work; your homepage says you ran it. Which is true?"

3. **The parser answers a different question than the one asked.** I asked the API to compare "software developer and registered nurse." I got six careers back, and three I never mentioned — nurse anesthetists (90), nurse practitioners (84), nurse midwives (84) — ranked above both careers I asked about (RN 75, SWE 73), plus statisticians. The documented redirect threshold isn't the cause (RN scored 75); this is the free-text parse substring-matching "nurse" into every nurse title and merging them into the main ranking. Exact/synonym title match should pin to the named occupation; siblings should appear in a visually separate "stronger adjacent paths you didn't ask about" band, never interleaved. Interview question: "Walk me through your entity resolution."

4. **The "Selective schools" list on the flagship career page is visibly wrong to the exact audience it will get.** /career/15-1252.00 lists Pomona, Claremont McKenna, USC, Harvey Mudd, Northeastern Oakland, Colorado College. No MIT, Stanford, CMU, Berkeley — and not UIUC. Root cause in scripts/pipeline/build-education.mjs: "selective" is defined as SAT_AVG present (silently excluding test-optional/blind elites), the candidate pool is capped at the first 60 encountered in file order (line 110), then sorted by admit rate. Fix the pool or cut the section entirely. A missing feature costs nothing; a wrong list costs trust.

5. **The "estimated skill vector" disclosure doesn't reach the page where it matters most.** Methodology promises the 25 estimated SOC codes are "flagged as estimates in the data" — the CSV does flag software developers, but the SD career page shows moat, fit claims, and neighbors with no flag anywhere. One line on affected pages: "Capability vector estimated from SOC-group siblings — see methodology."

6. **Bare SOC codes 404.** /career/15-1252 returns 404; only /career/15-1252.00 works. Redirect bare NN-NNNN codes to NN-NNNN.00. Fifteen minutes.

7. **Ship the custom domain.** Live on the raw Amplify subdomain, which reads "class project" before a single word is read; the architecture page itself lists the domain as "planned"; og:url bakes in the Amplify URL.

8. **Tighten the 90-second recruiter path.** The home-page back-test box is the single best thing on the site and the case-study headline is a real hook. But the case study is the last of seven nav items, three of which ("Methodology," "How it's built," "Case study") are near-synonyms to an outsider; the spec-gap story is the fourth section of a long essay; nothing on the home page body points a recruiter at it. Add "Hiring? The 3-minute case study →"; collapse nav to five items; move "The honest part" to section two.

9. **Small credibility nits.** Case study says "32 unit tests"; TALKING_POINTS/CI say 30 — pick one source of truth. "Prompt-injection-proof by design" — absolute security claims are a red flag to security-literate readers; "resistant by construction" says the same without the hubris. Top-20: 18 of 20 entries sit at ±9/±10 against a ±10 gate — one honest sentence ("even these barely pass — that's the point") turns a probe into a talking point.

**What's already strongest — do not dilute:** (1) The back-test, honestly read — publishing that raw BLS projection alone beat the full model, that AI-risk added nothing for a pre-LLM decade, and naming the misses is the single rarest behavior I see in candidate projects. (2) The reconciliation story — pre-written, receipted in the public repo. (3) Auditability as a posture — formulas with explicit weights, the 730-row CSV, five-model spread, 729-run sensitivity, verified security headers. The pattern: this project's brand is "the claims match the code" — every place they don't costs triple. Close those gaps and the site dictates what I ask about in the interview, which is the whole game.

### Sally 🎨 — UX audit (verbatim)

**Overall:** a genuinely strong product surface — PageExplainers, starter chips, the "I don't know yet" path, the zero-results state on /explore, the moat click-to-explain, and the print stylesheet are better than most shipped products. What remains is mostly seams: places where two good pieces meet and the numbers, words, or scales don't line up.

**HIGH**

H1. The home page buries its one primary action under recruiter material. Order on / is h1 → subhead → cred line → the 📜 back-test card ("rank correlation ρ = 0.39…") → PageExplainer → then the search box. On a 375px phone that's roughly a full viewport of text before the input; the back-test card is the most jargon-dense element on the site, placed in the anxious student's critical path. Move it below the form or collapse to one line ("📜 Back-tested against 2014–2024 — see how it did →").

H2. The search box fails silently in the most common failure modes (CareerForm.tsx 283–364, 489–497): (a) no form, no Enter handling — typing "nurse" and hitting Enter does nothing; (b) no-match input shows nothing (no "no results" row); (c) "Rate my paths" sits disabled with zero explanation; (d) dropdown has no combobox/listbox semantics, no aria-expanded, no arrow keys, no aria-live. Fix: form + Enter selects top match; "No matches for 'X' — browse all 730 →" row (reuse the 404 pattern); combobox semantics.

H3. Four rating signals on one header, two scales, opposite directions. SW devs shows 4.5★ (relative) + "top 14%" (relative) + "Mixed" (absolute) + 58/100 (absolute) simultaneously. The core answer requires inference to read. Caption the scales ("★ vs. all 730 careers") + one reconciling sentence ("Elite market position, discounted for AI exposure").

H4. The score changes between pages with no signpost. Verified live: SD scores 73 on home with interests, 58 on its career page (neutral baseline); the explanation exists only inside a collapsed PageExplainer. An explanation nobody finds doesn't exist. Add an always-visible "Neutral baseline — same for everyone; your personalized rating may differ" line.

**MEDIUM**

M1. "Fit 50" shown when the user gave no interests — reads as "mediocre match" instead of "not measured." Render "Fit — · add interests to unlock."
M2. Dark-mode contrast gaps: field chips text-purple-700, selected interest chips text-emerald-700, ScoreCard tone classes — no dark: variants (~3:1 on #0a0a0a); the bulls/bears headers prove the pattern (dark:text-emerald-400).
M3. Stars render three ways: SVG half-star on home/career; "★".repeat(Math.round()) on /explore (4.5 displays as 5); "★ 5.0 · 75" on field pages, where 20 of 48 rows are identical "★ 5.0". Use the shared Stars component everywhere.
M4. Top-20 explainer teaches "±3" as its example; all 20 real rows are ±9/±10. Use a real row; reframe the column.
M5. Cards say "Resilience 38 (higher = harder to disrupt)"; FrontierChart axis says "Risk →". Same quantity, opposite polarity, two inches apart. Flip the chart axis or label it "AI risk (= 100 − resilience)".
M6. /explore SSR HTML says "0 shown" over an empty table until the client fetch lands — looks broken on slow connections. Add skeleton rows.
M7. Chart-expand modal: role=dialog but no Esc, no focus trap, no focus restore.
M8. Dead end after the answer: nothing invites the just-scored user to /explore, /sky, or /top-20; "Sky" nav label is opaque. Add a "Keep exploring" row after results.
M9. Nav squeeze at 640–780px (7 pills + wordmark, hamburger only below 640); "Methodology / How it's built / Case study" are three near-synonyms — half the nav is meta. Hamburger through ~820px or collapse into one "About the model"; hamburger tap target 36px → 44px.

**LOW:** L1 "Download report" runs window.print() — relabel. L2 /45–/55 opacity at ≤12px below AA — sweep to /60+. L3 tooltip-only formulas untouchable on mobile. L4 bare-SOC 404 (client-rendered only — empty for crawlers). L5 Sky mobile hit-targets/keyboard path; UMAP params one details deeper. L6 explore headers not click-sortable. L7 copy-link silent failure. L8 robustness notation needs micro-legend. L9 error copy "and" → "or". Brand check passes everywhere incl. 404 + print; nit: hero cred-line uses a generic ★ not the tilted brand star.

**Top 5 first:** (1) reorder home; (2) make search unbreakable; (3) reconcile the rating scales + page-transition signpost (same root problem); (4) a11y/dark bundle (M2+M7+L2); (5) consistency sweep (M3+M4+M5) — this is a credibility product; a recruiter who notices the ±3-that-never-appears has found the exact kind of overclaim the case study says was hunted down.

### Marisol 🧪 — QA sweep (verbatim)

Target: live site + repo suite. Method: curl-only. Local suite: 32/32 pass.

**Blockers:** none. Nothing down, no data corruption, no XSS, no injection.

**Major:**
1. Per-client rate limiting does not fire live: 30 rapid POSTs to /api/score → 30×400, zero 429s; 25 valid /api/feedback POSTs → 25×200. Expected 429 after ~20/min (MAX_REQUESTS=20). Likely per-Lambda-instance buckets and/or clientKey() taking the last X-Forwarded-For hop, which behind CloudFront can be a varying edge IP — fresh bucket per request. Only the per-instance GLOBAL_MAX=600 backstop is real. Verify the actual XFF hop in CloudWatch or move to a shared store. Matters because /api/score fans out to a paid Anthropic call.
2. ashleylibasci.com serves the app, but its robots.txt advertises the amplifyapp sitemap, all 758 sitemap locs and every og:url are amplifyapp.com, and no page has rel=canonical. The branded domain actively tells crawlers to index the throwaway one. Fix metadataBase.
3. Glued words on /case-study (the recruiter page): "nothingfor", "adjustedscore", "right?My" — source has the spaces (app/case-study/page.tsx:161,183,190); the deployed build eats them (known Next inline-JSX bug; line 58 already uses the {" "} workaround). Only these three exist site-wide; I checked every page for the class.

**Minor:** 4. Career pages ship per-career og:image but generic og:title/og:url — mismatched share cards. 5. Bare SOC /career/15-1252 → 404 instead of redirecting to .00. 6. opengraph-image returns identical 200 PNGs for garbage codes (cache noise). 7. Under aiAdoption scenarios the verdict note says "exposure 87/100" while breakdown/bears say 100 — plainVerdict uses unadjusted exposure. 8. No Content-Security-Policy header (nosniff/XFO/HSTS-preload/referrer/permissions all present).

**Nit:** 9. Unknown-codes-only request → "Couldn't match your text" (user sent codes). 10. /api/feedback accepts 200KB bodies (validated fields keep logs clean — cosmetic). 11. 404 page title is the generic site title.

**Verified clean:** all routes incl. /architecture; trailing-slash 308s; wrong-method 405s; sitemap 758 URLs w/ sampled 200s; CSV 730 clean rows, scores 16–75, stars 1–5; API abuse (empty/malformed/2001-char boundary/hostile weights/__proto__) all clean 400s or inert; /api/sky-position honest {"placed":false} on nonsense; /api/leaderboard 730 no-NaN; XSS escaped at all three reflection sites on /explore; visible-text scan of 11 pages zero undefined/NaN/glue outside the 3 case-study spots; moat counts sum to 730; top-20 exactly 20.

**Verdict: ship-with-notes.** The data layer, scoring API, and route surface are genuinely solid. Fix the three majors soon — #3 is three one-line edits on the page recruiters read; #2 is a metadataBase constant; #1 needs a real decision. #1 is the only one I'd lose sleep over if the site gets traffic.
