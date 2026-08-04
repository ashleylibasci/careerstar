// CareerStar — Capital One deck, v7.
// The redesign premise: the site's primary face is LIGHT (white canvas, ink
// text, cobalt accent) — so the deck is too. Night-sky is reserved for the
// bookends (title + close), where the constellation earns its drama.
// PULSE-strict: four working colors, 14pt floor, real title placeholders,
// text inside shapes, one grid.
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");

const STAR_PATH =
  "M8.86 4.12Q9.29 1.73 10.79 3.64L12.01 5.19Q13.99 7.69 17.14 7.26L19.09 6.99Q21.50 6.66 20.15 8.68L19.06 10.32Q17.29 12.97 18.67 15.84L19.53 17.61Q20.58 19.80 18.24 19.14L16.35 18.61Q13.28 17.74 10.98 19.94L9.56 21.31Q7.80 22.98 7.71 20.56L7.63 18.59Q7.51 15.41 4.70 13.90L2.96 12.97Q0.83 11.82 3.10 10.98L4.95 10.30Q7.94 9.19 8.51 6.06Z";

// ---- palette --------------------------------------------------------------
const C = {
  ink: "0F172A", // titles, primary body
  slate: "64748B", // secondary text, captions
  cobalt: "1D4ED8", // the accent — kickers, display numbers, key lines
  mist: "EFF3FB", // card fill
  line: "DDE5F2", // hairlines, card borders
  white: "FFFFFF",
  green: "047857", // used once (the catch column / dial)
  amber: "B45309", // used once (the awkward-number callout)
  // dark bookends
  night: "070D24",
  nightText: "E8EEFC",
  nightMuted: "9DB0D9",
  nightAccent: "4F74F0",
  nightPanel: "101A38",
  nightLine: "24325C",
};
const SANS = "Arial";

// ---- assets ---------------------------------------------------------------
async function png(svg) {
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
function starSvg(color, size, opacity = 1) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${Math.round((size * 25) / 24)}" viewBox="0 0 24 25"><path d="${STAR_PATH}" fill="${color}" fill-opacity="${opacity}"/></svg>`;
}
function constellationSvg(w, h) {
  const stars = [
    [120, 140, 1.4, 0.9], [340, 70, 0.9, 0.6], [560, 190, 1.1, 0.8],
    [830, 90, 0.7, 0.5], [1080, 200, 1.6, 0.95], [1330, 120, 0.9, 0.6],
    [1580, 260, 1.2, 0.8], [1780, 100, 0.8, 0.55],
    [220, 760, 1.0, 0.6], [520, 900, 1.3, 0.8], [900, 830, 0.8, 0.5],
    [1250, 920, 1.2, 0.75], [1620, 800, 1.5, 0.9], [1840, 950, 0.9, 0.55],
  ];
  const lines = [
    [120, 140, 340, 70], [340, 70, 560, 190], [560, 190, 830, 90],
    [1080, 200, 1330, 120], [1330, 120, 1580, 260],
    [520, 900, 900, 830], [1250, 920, 1620, 800],
  ];
  let g = "";
  for (const [x1, y1, x2, y2] of lines)
    g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4F74F0" stroke-opacity="0.28" stroke-width="1.5"/>`;
  for (const [x, y, s, o] of stars)
    g += `<g transform="translate(${x - 12 * s},${y - 12.5 * s}) scale(${s})"><path d="${STAR_PATH}" fill="#9DB9FF" fill-opacity="${o}"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="#070D24"/>
  <radialGradient id="bloom" cx="50%" cy="8%" r="75%">
    <stop offset="0%" stop-color="#1D4ED8" stop-opacity="0.30"/>
    <stop offset="100%" stop-color="#1D4ED8" stop-opacity="0"/>
  </radialGradient>
  <rect width="${w}" height="${h}" fill="url(#bloom)"/>
  ${g}</svg>`;
}
function dialLightSvg(score, size) {
  const r = 84, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#DDE5F2" stroke-width="14"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#047857" stroke-width="14" stroke-linecap="round"
    stroke-dasharray="${filled} ${circ}" transform="rotate(-90 ${cx} ${cy})"/>
  <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="62" fill="#0F172A">${score}</text>
  <text x="${cx}" y="${cy + 36}" text-anchor="middle" font-family="Arial" font-size="20" fill="#64748B">/100</text>
</svg>`;
}

(async () => {
  const heroBg = await png(constellationSvg(1920, 1080));
  const starCobalt = await png(starSvg("#1D4ED8", 96));
  const starNight = await png(starSvg("#9DB9FF", 96));
  const dial73 = await png(dialLightSvg(73, 220));

  const pptx = new pptxgen();
  pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "WIDE";
  pptx.author = "Ashley Libasci";
  pptx.title = "CareerStar — spec-driven development at Capital One";

  // ---- masters ------------------------------------------------------------
  pptx.defineSlideMaster({
    title: "LIGHT",
    background: { color: C.white },
    objects: [
      { placeholder: { options: { name: "kicker", type: "body", x: 0.98, y: 0.52, w: 11.5, h: 0.32 }, text: "" } },
      { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 0.92, w: 11.93, h: 1.0 }, text: "" } },
    ],
  });
  pptx.defineSlideMaster({
    title: "DARK",
    background: { data: heroBg },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 1.67, y: 2.05, w: 10, h: 1.25 }, text: "" } },
      { placeholder: { options: { name: "sub", type: "body", x: 1.67, y: 3.35, w: 10, h: 0.6 }, text: "" } },
    ],
  });
  pptx.defineSlideMaster({
    title: "DARKCLOSE",
    background: { color: C.night },
    objects: [
      { placeholder: { options: { name: "title", type: "title", x: 0.7, y: 0.92, w: 11.93, h: 1.0 }, text: "" } },
    ],
  });

  // ---- helpers ------------------------------------------------------------
  const M = 0.7; // page margin
  const CW = 13.333 - 2 * M; // content width 11.93
  const COL = 5.75; // column width for two-column layouts
  const COL2X = M + COL + 0.43; // second column x = 6.88

  function kicker(s, text) {
    s.addImage({ data: starCobalt, x: M, y: 0.55, w: 0.19, h: 0.2 });
    s.addText(text.toUpperCase(), {
      placeholder: "kicker",
      fontFace: SANS, fontSize: 14, bold: true, color: C.cobalt, charSpacing: 2.5, margin: 0,
    });
  }
  function title(s, text, opts = {}) {
    s.addText(text, {
      placeholder: "title", align: "left",
      fontFace: SANS, fontSize: 30, bold: true, color: C.ink, margin: 0, ...opts,
    });
  }
  function txt(s, runs, o) {
    s.addText(runs, {
      x: o.x, y: o.y, w: o.w, h: o.h, margin: 0,
      valign: o.valign ?? "top", align: o.align ?? "left",
      fontFace: SANS, fontSize: 15, color: C.ink, lineSpacing: o.lineSpacing,
    });
  }
  function card(s, runs, o) {
    s.addText(runs, {
      shape: "roundRect", rectRadius: 0.08,
      fill: { color: o.fill ?? C.mist }, line: { color: o.line ?? C.line, width: 1 },
      x: o.x, y: o.y, w: o.w, h: o.h,
      margin: o.margin ?? 14, valign: o.valign ?? "middle", align: o.align ?? "left",
      fontFace: SANS, fontSize: 15, color: C.ink,
    });
  }
  function rule(s, x, y, w, color = C.line) {
    s.addShape("rect", { x, y, w, h: 0.014, fill: { color } });
  }
  function pageno(s, n) {
    s.addText(String(n), {
      x: 12.63, y: 7.02, w: 0.4, h: 0.3, margin: 0, align: "right",
      fontFace: SANS, fontSize: 14, color: C.slate,
    });
  }

  // == 1 · TITLE (dark) =====================================================
  {
    const s = pptx.addSlide({ masterName: "DARK" });
    s.addImage({ data: starNight, x: 6.31, y: 1.42, w: 0.68, h: 0.71 });
    s.addText([
      { text: "Career", options: { color: "FFFFFF" } },
      { text: "Star", options: { color: C.nightAccent } },
    ], { placeholder: "title", align: "center", fontFace: SANS, fontSize: 60, bold: true, margin: 0 });
    s.addText("How I spec-built a ratings agency with a team of AI agents.", {
      placeholder: "sub", align: "center", fontFace: SANS, fontSize: 20, color: C.nightMuted, margin: 0,
    });
    s.addShape("rect", { x: 5.92, y: 5.28, w: 1.5, h: 0.016, fill: { color: C.nightAccent } });
    txt(s, [
      { text: "Ashley Libasci", options: { fontSize: 16, bold: true, color: C.nightText, breakLine: true } },
      { text: "Math + CS, UIUC ’27  ·  ashleylibasci.com", options: { fontSize: 14, color: C.nightMuted, breakLine: true } },
      { text: "Capital One · August 6, 2026", options: { fontSize: 14, color: C.nightMuted } },
    ], { x: 3.17, y: 5.55, w: 7, h: 1.2, align: "center", lineSpacing: 24 });
    s.addNotes(
      "Hi, I'm Ashley. This summer I built a ratings agency for careers. The site's fine — but the part I actually want to show you is how it got built, because the workflow is more interesting than the product. Quick tour of the thing, then the build. (0:45)",
    );
  }

  // == 2 · THE PRODUCT (light) =============================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "01 · The thing itself");
    title(s, "CareerStar rates careers the way you rate assets");
    // product card — the one screenshot stand-in, so it gets the card treatment
    card(s, [
      { text: "★ BEST BET", options: { fontSize: 14, bold: true, color: C.cobalt, breakLine: true } },
      { text: "Registered nurses", options: { fontSize: 21, bold: true, color: C.ink, breakLine: true } },
      { text: "Top tier · top 10% of careers · wide moat", options: { fontSize: 14, color: C.green, breakLine: true } },
      { text: "Return 71 · Resilience 78 · Fit 62", options: { fontSize: 14, color: C.slate, breakLine: true } },
      { text: "", options: { fontSize: 6, breakLine: true } },
      { text: "Bulls: strong growth, wide moat.", options: { fontSize: 14, color: C.slate, breakLine: true } },
      { text: "Bears: pay trails other graduate paths.", options: { fontSize: 14, color: C.slate } },
    ], { x: M, y: 2.2, w: 4.4, h: 2.95, valign: "top", margin: 16 });
    s.addImage({ data: dial73, x: 5.35, y: 2.85, w: 1.7, h: 1.7 });
    // stat rows, typographic
    const facts = [
      ["730", "U.S. occupations, every one rated"],
      ["5", "rival scoring models, swappable live"],
      ["★", "stars on a forced curve, moats on the side"],
    ];
    let y = 2.3;
    for (const [big, small] of facts) {
      txt(s, [{ text: big, options: { fontSize: 36, bold: true, color: C.cobalt } }], { x: 7.5, y: y - 0.08, w: 1.35, h: 0.62 });
      txt(s, [{ text: small, options: { fontSize: 16, color: C.ink } }], { x: 8.95, y: y + 0.1, w: 3.7, h: 0.55 });
      if (big !== "★") rule(s, 7.5, y + 0.78, 5.13);
      y += 0.99;
    }
    rule(s, M, 5.55, CW);
    txt(s, [
      { text: "Data: BLS projections · O*NET skills · published AI-exposure research      ", options: { fontSize: 14, color: C.slate } },
      { text: "Live at ashleylibasci.com — the build is today’s story.", options: { fontSize: 14, bold: true, color: C.ink } },
    ], { x: M, y: 5.8, w: CW, h: 0.5 });
    pageno(s, 2);
    s.addNotes(
      "Ninety seconds so the rest makes sense. Every U.S. occupation gets a 0-100 score, same shape as a risk-adjusted return. Stars on a forced curve, moats borrowed from Morningstar, and you can swap the scoring model live. That's the product. Now the actual talk. (1:00)",
    );
  }

  // == 3 · THE NAME (light) ================================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "02 · The method");
    title(s, "There’s a name for how this was built");
    txt(s, [{ text: "Spec-driven development", options: { fontSize: 44, bold: true, color: C.cobalt } }],
      { x: M, y: 2.25, w: CW, h: 0.8 });
    txt(s, [{ text: "Write the spec first. The AI codes to the contract.", options: { fontSize: 21, color: C.ink } }],
      { x: M, y: 3.1, w: CW, h: 0.5 });
    rule(s, M, 3.9, CW);
    txt(s, [
      { text: "What that means in practice", options: { fontSize: 16, bold: true, color: C.ink, breakLine: true } },
      { text: "", options: { fontSize: 6, breakLine: true } },
      { text: "Requirements, architecture, and acceptance criteria exist before any code does — every agent works against them.", options: { fontSize: 15, color: C.slate } },
    ], { x: M, y: 4.2, w: COL, h: 1.5 });
    txt(s, [
      { text: "What it isn’t: vibe coding", options: { fontSize: 16, bold: true, color: C.slate, breakLine: true } },
      { text: "", options: { fontSize: 6, breakLine: true } },
      { text: "Prompt as you go, context evaporates. Fine for a weekend hack, fatal for a real system.", options: { fontSize: 15, color: C.slate } },
    ], { x: COL2X, y: 4.2, w: COL, h: 1.5 });
    card(s, [
      { text: "My framework: BMAD ", options: { fontSize: 15, bold: true, color: C.cobalt } },
      { text: "(Breakthrough Method for Agile AI-Driven Development) — open source, agent-based. First project with it. It converted me.", options: { fontSize: 15, color: C.ink } },
    ], { x: M, y: 5.95, w: CW, h: 0.85 });
    pageno(s, 3);
    s.addNotes(
      "When people hear 'AI wrote most of my code' they picture vibe coding: prompt, paste, pray. This is the other school, and it has a name: spec-driven development. You write the contract first, then the AI codes against it. BMAD is the open-source framework I used — first time, and it converted me. Next two slides are why. (1:00)",
    );
  }

  // == 4 · PIPELINE (light) ================================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "03 · BMAD");
    title(s, "The pipeline: plan it, build it, attack it");
    const boxes = [
      ["PLAN", "A PM agent interrogates the requirements into a PRD. An architect locks the invariants — mine has seven."],
      ["BUILD", "Work splits into 7 epics of stories with acceptance criteria. A dev agent codes each story, tests included."],
      ["ATTACK", "A cast of reviewer personas tears into every change. A retro after each epic feeds the next."],
    ];
    let x = M;
    for (const [head, body] of boxes) {
      card(s, [
        { text: head, options: { fontSize: 19, bold: true, color: C.cobalt, charSpacing: 2, breakLine: true } },
        { text: "", options: { fontSize: 8, breakLine: true } },
        { text: body, options: { fontSize: 15, color: C.ink } },
      ], { x, y: 2.3, w: 3.55, h: 2.5, valign: "top", margin: 16 });
      x += 4.19;
    }
    s.addText("→", { x: 4.32, y: 3.3, w: 0.5, h: 0.5, align: "center", margin: 0, fontFace: SANS, fontSize: 24, bold: true, color: C.cobalt });
    s.addText("→", { x: 8.51, y: 3.3, w: 0.5, h: 0.5, align: "center", margin: 0, fontFace: SANS, fontSize: 24, bold: true, color: C.cobalt });
    rule(s, M, 5.35, CW);
    txt(s, [
      { text: "The invariant that mattered most:  ", options: { fontSize: 16, color: C.slate } },
      { text: "“the LLM never computes a number”", options: { fontSize: 18, bold: true, color: C.cobalt } },
      { text: "  — locked in the architecture before a line of scoring code existed.", options: { fontSize: 16, color: C.slate } },
    ], { x: M, y: 5.7, w: CW, h: 0.9 });
    pageno(s, 4);
    s.addNotes(
      "Three phases. Plan: the PM agent keeps asking why — my fluffy answers died in that interview, and the PRD was better than anything I'd have written alone. The architect locked seven invariants, and the big one: the LLM never computes a number. Build: seven epics, every story with acceptance criteria. Attack: next slide. (2:00)",
    );
  }

  // == 5 · THE CAST (light) ================================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "04 · BMAD, continued");
    title(s, "My code reviews are a room full of arguing characters");
    txt(s, [{ text: "The cast", options: { fontSize: 16, bold: true, color: C.cobalt } }], { x: M, y: 2.3, w: COL, h: 0.35 });
    rule(s, M, 2.72, COL);
    txt(s, [
      { text: "a hiring-manager persona asking what an interviewer would", options: { fontSize: 15, color: C.ink, breakLine: true } },
      { text: "a fact-checker tracing every published number to a file", options: { fontSize: 15, color: C.ink, breakLine: true } },
      { text: "a copy chief deleting anything that sounds machine-written", options: { fontSize: 15, color: C.ink, breakLine: true } },
      { text: "a QA lead, a design critic, one professional grump", options: { fontSize: 15, color: C.ink, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "They argue with each other. I judge.", options: { fontSize: 16, bold: true, color: C.cobalt } },
    ], { x: M, y: 2.95, w: COL, h: 2.7, lineSpacing: 27 });
    txt(s, [{ text: "What they caught", options: { fontSize: 16, bold: true, color: C.green } }], { x: COL2X, y: 2.3, w: COL, h: 0.35 });
    rule(s, COL2X, 2.72, COL);
    txt(s, [
      { text: "The fit overclaim. ", options: { fontSize: 15, bold: true, color: C.ink } },
      { text: "My methodology page described skill-vector matching before the vectors were wired in. Caught, rebuilt, then published as the story of the catch.", options: { fontSize: 15, color: C.slate, breakLine: true } },
      { text: "", options: { fontSize: 10, breakLine: true } },
      { text: "The buried back-test. ", options: { fontSize: 15, bold: true, color: C.ink } },
      { text: "The hiring-manager persona fought twice to keep my strongest evidence above the fold. It was right.", options: { fontSize: 15, color: C.slate } },
    ], { x: COL2X, y: 2.95, w: COL, h: 2.7 });
    rule(s, M, 6.0, CW);
    txt(s, [{ text: "Honest review: this was fun. That matters — review you enjoy is review you actually run.", options: { fontSize: 16, italic: true, color: C.cobalt } }],
      { x: M, y: 6.25, w: CW, h: 0.45, align: "center" });
    pageno(s, 5);
    s.addNotes(
      "This is the part that hooked me. Reviews aren't one agreeable AI saying 'great job' — they're personas with opposite priorities fighting it out, and I judge. Best catch: my own methodology page overclaimed how fit worked. Caught in review, rebuilt right, then published the story of the catch — now the strongest section of my case study. And it's fun, which is load-bearing. (1:30)",
    );
  }

  // == 6 · VIBE VS SDD (light) =============================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "05 · The difference");
    title(s, "Same AI. Opposite discipline.");
    const rows = [
      ["Prompt, paste, pray", "Spec first: PRD, architecture, stories"],
      ["Accept whatever runs", "35 deterministic tests, CI on every push"],
      ["One agreeable assistant", "A cast of adversarial reviewers"],
      ["The LLM does the math", "The LLM never computes a number"],
      ["Claims", "A back-test, a robustness grid, an open CSV"],
    ];
    txt(s, [{ text: "VIBE CODING", options: { fontSize: 15, bold: true, color: C.slate, charSpacing: 2.5 } }], { x: M, y: 2.3, w: COL, h: 0.35 });
    txt(s, [{ text: "SPEC-DRIVEN", options: { fontSize: 15, bold: true, color: C.cobalt, charSpacing: 2.5 } }], { x: COL2X, y: 2.3, w: COL, h: 0.35 });
    rule(s, M, 2.72, COL);
    rule(s, COL2X, 2.72, COL, C.cobalt);
    let y = 2.98;
    for (const [l, r] of rows) {
      txt(s, [{ text: l, options: { fontSize: 16, color: C.slate } }], { x: M, y, w: COL, h: 0.45, valign: "middle" });
      txt(s, [{ text: r, options: { fontSize: 16, bold: true, color: C.ink } }], { x: COL2X, y, w: COL, h: 0.45, valign: "middle" });
      y += 0.62;
    }
    rule(s, M, 6.2, CW);
    txt(s, [{ text: "AI typed most of this project. The discipline is the difference.", options: { fontSize: 17, italic: true, color: C.cobalt } }],
      { x: M, y: 6.45, w: CW, h: 0.45, align: "center" });
    pageno(s, 6);
    s.addNotes(
      "I won't pretend AI didn't type most of this — that's the point. The difference isn't the tool. It's whether a spec exists before the prompt, tests after it, an adversarial pass before shipping, and a human who can defend every decision. (1:00)",
    );
  }

  // == 7 · THE IDEA (light) ================================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "06 · The idea");
    title(s, "The model is just how you’d size up a stock");
    const steps = [
      ["What do you get?", "Growth and pay — how fast the career is growing, and what it pays.", "BLS projections"],
      ["What can kill it?", "How much of the day-to-day work AI can already do.", "AI-exposure research"],
      ["Does it fit you?", "The job’s real skill profile, matched to your interests.", "O*NET database"],
    ];
    let y = 2.35;
    for (const [q, a, src] of steps) {
      txt(s, [{ text: q, options: { fontSize: 22, bold: true, color: C.cobalt } }], { x: M, y, w: 3.9, h: 0.5 });
      txt(s, [{ text: a, options: { fontSize: 16, color: C.ink } }], { x: 4.85, y: y + 0.03, w: 5.7, h: 0.75 });
      txt(s, [{ text: src, options: { fontSize: 14, italic: true, color: C.slate } }], { x: 10.8, y: y + 0.06, w: 1.83, h: 0.5 });
      rule(s, M, y + 0.92, CW);
      y += 1.22;
    }
    txt(s, [{ text: "Answer the three questions with data, discount the reward by the risk — that’s the whole model.", options: { fontSize: 16, italic: true, color: C.slate } }],
      { x: M, y: 6.25, w: CW, h: 0.45, align: "center" });
    pageno(s, 7);
    s.addNotes(
      "Before the formula, where it comes from. It's just how you'd size up a stock, asked about a career. What do you get: growth and pay, from BLS. What can kill it: AI, from published exposure research. Does it fit you: real skills data from O*NET. Three questions, three public datasets. The next slide is these sentences written down. (1:00)",
    );
  }

  // == 8 · THE FORMULA (light) =============================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "07 · The formula");
    title(s, "Those three sentences, written down");
    const lines = [
      ["Return  =  ½ growth  +  ½ pay", "what you get — each as a rank against all 730"],
      ["Risk  =  0.7 AI  +  0.3 volatility", "what can kill it"],
      ["Value  =  Return × (1 − 0.6 Risk)", "reward, discounted by risk"],
      ["Score  =  70% Value  +  30% Fit", "blend in the match to you — out of 100"],
    ];
    let y = 2.35;
    for (const [eq, gloss] of lines) {
      txt(s, [{ text: eq, options: { fontSize: 20, bold: true, color: C.ink } }], { x: M, y, w: 6.3, h: 0.5 });
      txt(s, [{ text: gloss, options: { fontSize: 15, color: C.slate } }], { x: 7.2, y: y + 0.07, w: 5.43, h: 0.5 });
      rule(s, M, y + 0.66, CW);
      y += 0.94;
    }
    card(s, [
      { text: "The 0.7s and 0.6s are judgment calls, and I say so.  ", options: { fontSize: 15, bold: true, color: C.ink } },
      { text: "Every ranking is re-scored 729 times with the weights shaken ±20%, plus by five rival formulas. If the answer flips, the site says “close call.”", options: { fontSize: 15, color: C.slate } },
    ], { x: M, y: 6.1, w: CW, h: 0.95 });
    pageno(s, 8);
    s.addNotes(
      "Line by line: return is growth plus pay, each ranked against all 730 — the real question is 'versus my alternatives.' Risk is mostly AI exposure. Value is return discounted by risk, multiplied not subtracted, because that's how you treat a return. Then blend in fit. The honest part: the weights are judgment calls with no ground truth to fit them on, so every ranking gets re-scored 729 times plus five rival formulas — including a plain average as the control. (1:30)",
    );
  }

  // == 9 · RECEIPTS (light) ================================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "08 · The receipts");
    title(s, "I tested it on a decade that already happened");
    const tiles = [
      ["0.39", "rank correlation vs\nwhat really happened"],
      ["48%", "of real decliners flagged\n(33% by chance)"],
      ["37 · 46", "median 2014 score:\ndecliners vs growers"],
      ["~0", "AI exposure’s signal —\nexpected: no LLMs yet"],
    ];
    let x = M;
    for (const [big, small] of tiles) {
      txt(s, [{ text: big, options: { fontSize: 42, bold: true, color: C.cobalt } }], { x, y: 2.35, w: 2.85, h: 0.75 });
      txt(s, [{ text: small, options: { fontSize: 14, color: C.slate } }], { x, y: 3.15, w: 2.75, h: 0.8, lineSpacing: 19 });
      x += 3.0;
    }
    rule(s, M, 4.2, CW);
    card(s, [
      { text: "Me, volunteering the awkward number:", options: { fontSize: 16, bold: true, color: C.amber, breakLine: true } },
      { text: "", options: { fontSize: 6, breakLine: true } },
      { text: "The government’s plain projections beat my full model on that decade, 0.411 to 0.39. That’s the model working — the AI term is a bet about the coming decade, and the tested one had no LLMs in it. ", options: { fontSize: 15, color: C.ink, breakLine: true } },
      { text: "", options: { fontSize: 6, breakLine: true } },
      { text: "And the back-test never tunes the weights: fit to the test and it stops being a test.", options: { fontSize: 15, bold: true, color: C.ink } },
    ], { x: M, y: 4.55, w: CW, h: 2.05, valign: "middle", margin: 16, line: C.amber, fill: "FDF6EC" });
    pageno(s, 9);
    s.addNotes(
      "Slow down here. I pulled the 2014 BLS projections from the Internet Archive, scored 2014's job market with today's formula, and graded it against what happened by 2024 — 647 occupations. It works: decliners flagged at 48% versus 33% by chance. Then I volunteer the awkward number before anyone asks: plain BLS beat my full model. And that's the model working — no LLMs existed, the AI term had nothing to price. Held out, never fitted. (1:30)",
    );
  }

  // == 10 · AWS (light) ====================================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "09 · The infrastructure");
    title(s, "Deploying it taught me more AWS than the practice exams");
    const boxes = [
      ["CODE", "GitHub. Push to main — that’s the whole release process."],
      ["ENGINE", "AWS Amplify builds the Next.js app and runs the server-rendered parts."],
      ["EDGE", "CloudFront serves it worldwide; Route 53 holds ashleylibasci.com."],
    ];
    let x = M;
    for (const [head, body] of boxes) {
      card(s, [
        { text: head, options: { fontSize: 19, bold: true, color: C.cobalt, charSpacing: 2, breakLine: true } },
        { text: "", options: { fontSize: 8, breakLine: true } },
        { text: body, options: { fontSize: 15, color: C.ink } },
      ], { x, y: 2.3, w: 3.55, h: 2.05, valign: "top", margin: 16 });
      x += 4.19;
    }
    s.addText("→", { x: 4.32, y: 3.05, w: 0.5, h: 0.5, align: "center", margin: 0, fontFace: SANS, fontSize: 24, bold: true, color: C.cobalt });
    s.addText("→", { x: 8.51, y: 3.05, w: 0.5, h: 0.5, align: "center", margin: 0, fontFace: SANS, fontSize: 24, bold: true, color: C.cobalt });
    rule(s, M, 4.75, CW);
    txt(s, [{ text: "Cloud Practitioner concepts this made real", options: { fontSize: 16, bold: true, color: C.ink } }], { x: M, y: 5.0, w: CW, h: 0.4 });
    const concepts = ["managed services", "edge caching", "shared responsibility", "DNS + certificates"];
    let cx = M;
    for (const c of concepts) {
      txt(s, [
        { text: "★ ", options: { fontSize: 15, color: C.cobalt } },
        { text: c, options: { fontSize: 15, color: C.ink } },
      ], { x: cx, y: 5.5, w: 2.95, h: 0.4 });
      cx += 3.0;
    }
    txt(s, [{ text: "Studying for the cert now — this is where the flashcards became things I’d actually debugged.", options: { fontSize: 14, italic: true, color: C.slate } }],
      { x: M, y: 6.1, w: CW, h: 0.4 });
    pageno(s, 10);
    s.addNotes(
      "Push to main, Amplify builds, CloudFront serves from the edge, Route 53 holds the domain. The whole pipeline is a git push. I'm studying for Cloud Practitioner, and this is where the flashcard concepts became real things I'd debugged. Speaking of shared responsibility — next slide is my favorite bug of the summer. (1:30)",
    );
  }

  // == 11 · WAR STORY (light) ==============================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "10 · War story");
    title(s, "The rate limiter that never fired");
    const beats = [
      ["1", "What I did", "Keyed rate limits on the last X-Forwarded-For hop — the textbook advice, since everything left of it is forgeable."],
      ["2", "What production did", "30 rapid requests. Zero rate-limit hits. Every request got a fresh bucket."],
      ["3", "Why", "Amplify’s router appends CloudFront’s own IP after the client’s. The “last hop” was never the client — it was Amazon."],
      ["4", "The fix", "Second-to-last hop, a global cap as backstop, and a regression test pinning the header shapes."],
    ];
    let y = 2.3;
    for (const [n, head, body] of beats) {
      txt(s, [{ text: n, options: { fontSize: 26, bold: true, color: C.cobalt } }], { x: M, y: y - 0.03, w: 0.5, h: 0.5 });
      txt(s, [{ text: head, options: { fontSize: 17, bold: true, color: C.ink } }], { x: 1.35, y, w: 2.9, h: 0.45 });
      txt(s, [{ text: body, options: { fontSize: 15, color: C.slate } }], { x: 4.4, y: y + 0.02, w: 8.23, h: 0.75 });
      rule(s, M, y + 0.84, CW);
      y += 1.04;
    }
    txt(s, [{ text: "Practice exams don’t teach proxy chains. Production does.", options: { fontSize: 18, italic: true, bold: true, color: C.cobalt } }],
      { x: M, y: 6.55, w: CW, h: 0.45, align: "center" });
    pageno(s, 11);
    s.addNotes(
      "My favorite bug. I did the textbook thing — trust the last X-Forwarded-For hop. Then production: thirty rapid requests, zero rate limits. Amplify's router was appending CloudFront's own edge IP after the real client IP, so the last hop was never the client. It was Amazon. Fix: second-to-last hop, global backstop, regression test pinning the exact header shapes. Forty seconds of story, a semester of networking. (1:30)",
    );
  }

  // == 12 · CLOSE (dark) ===================================================
  {
    const s = pptx.addSlide({ masterName: "DARKCLOSE" });
    s.addImage({ data: starNight, x: 0.7, y: 0.55, w: 0.22, h: 0.23 });
    s.addText("Three things worth stealing", {
      placeholder: "title", align: "left", fontFace: SANS, fontSize: 30, bold: true, color: C.nightText, margin: 0,
    });
    const takes = [
      ["Write the spec before the prompt", "the discipline, not the model, is what made this work"],
      ["Publish what your model gets wrong", "the awkward numbers bought more trust than the good ones"],
      ["Pick tools that make rigor fun", "fun is load-bearing — review you enjoy is review you run"],
    ];
    let y = 2.4;
    for (const [head, sub] of takes) {
      txt(s, [{ text: head, options: { fontSize: 20, bold: true, color: C.nightText } }], { x: M, y, w: 7.6, h: 0.42 });
      txt(s, [{ text: sub, options: { fontSize: 15, color: C.nightMuted } }], { x: M, y: y + 0.46, w: 7.6, h: 0.4 });
      rule(s, M, y + 1.0, 7.6, C.nightLine);
      y += 1.28;
    }
    card(s, [
      { text: "2034", options: { fontSize: 44, bold: true, color: "FFFFFF", breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "I re-run the back-test on the 2024–34 decade and publish how my ratings aged.", options: { fontSize: 15, color: C.nightMuted, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Ratings agencies should eat their own cooking.", options: { fontSize: 15, italic: true, bold: true, color: "6EE7B7" } },
    ], { x: 8.85, y: 2.4, w: 3.78, h: 3.4, fill: C.nightPanel, line: C.nightLine, valign: "top", margin: 18 });
    rule(s, M, 6.35, CW, C.nightAccent);
    txt(s, [{ text: "Thanks — questions?    ashleylibasci.com  ·  github.com/ashleylibasci/careerstar", options: { fontSize: 15, color: C.nightText } }],
      { x: M, y: 6.6, w: CW, h: 0.45, align: "center" });
    s.addNotes(
      "Three things worth stealing: write the spec before the prompt. Publish what your model gets wrong — the awkward numbers bought me more trust than the good ones. Pick tools that make rigor fun, because fun is load-bearing. And in 2034 I re-run the back-test on the decade my model actually bet on, and publish how the ratings aged. Ratings agencies should eat their own cooking. Thanks. (0:45)",
    );
  }

  // == 13-15 · BACKUPS (light) =============================================
  function backup(titleText, items, n) {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "Backup · Q&A");
    title(s, titleText, { fontSize: 28 });
    let y = 2.35;
    for (const [q, a] of items) {
      txt(s, [{ text: q, options: { fontSize: 17, bold: true, color: C.cobalt } }], { x: M, y, w: CW, h: 0.4 });
      txt(s, [{ text: a, options: { fontSize: 15, color: C.slate } }], { x: M, y: y + 0.45, w: CW, h: 0.8 });
      rule(s, M, y + 1.3, CW);
      y += 1.52;
    }
    pageno(s, n);
  }
  backup("Weights, stars, and robustness", [
    ["“Why 0.7 and not 0.6?”", "Because I had to pick something and there’s nothing to fit on. So I say “prior” out loud and stress-test instead: 729 perturbations, five rival models, close calls labeled."],
    ["“How do the stars work?”", "Forced relative curve, straight from Morningstar: top 10% get five stars, next 22.5% get four, and so on — recomputed live under the user’s own weights."],
    ["“Isn’t AI exposure just decline by another name?”", "No. Across all 730, exposure and projected growth are nearly uncorrelated. Exposure knows something growth doesn’t."],
  ], 13);
  backup("Back-test details", [
    ["“Where did 2014 wages come from?”", "The archived table has no 2015 wages, so pay percentiles use today’s ranking as a proxy — pay order barely moves. A growth-only variant shows the proxy changes almost nothing. All disclosed."],
    ["“Biggest misses?”", "It liked oil-and-gas jobs in 2014; oil crashed. It underrated couriers; e-commerce boomed. Both named on the site, raw data downloadable."],
    ["“Survivorship?”", "SOC-2010 joined to SOC-2018 on matching codes; reorganized occupations drop out and the counts are published — 647 joined."],
  ], 14);
  backup("Stack, and the Anthropic connection", [
    ["“Stack?”", "Next.js 16, React 19, TypeScript, Tailwind 4, AWS Amplify. ~35 unit tests on the scoring library, pipeline scripts rebuilding every dataset from source, open CSV and code on GitHub."],
    ["“What did the AI get wrong?”", "Plenty — that’s what the review cast is for. Best one: the fit overclaim. Caught in review, rebuilt properly, published as the case study centerpiece."],
    ["“Anthropic’s labor research?”", "Same upstream dataset (Eloundou 2023). Their 2026 work layered real usage on it: 97% of observed use inside tasks rated feasible — independent validation of my exposure input."],
  ], 15);

  await pptx.writeFile({ fileName: "/Users/ashleylibasci/ashleyaiproject/docs/CareerStar-CapitalOne-v7.pptx" });
  console.log("deck v7 (light redesign) written");
})().catch((e) => { console.error(e); process.exit(1); });
