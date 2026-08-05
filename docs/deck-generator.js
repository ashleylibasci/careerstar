// CareerStar — Capital One deck, v10.
// v10, after Ashley's note: v9 assumed the audience already knew the jargon.
// Every slide now explains its own terms in plain language (what hosting is,
// what an agent is, what the formula's inputs mean) and reads like a person
// talking, not ad copy. "Backup" slides are renamed "spares" and a divider
// slide after the close explains what they are.
// Evidence numbers trace to the repo: 1 written plan (PRD), 7 rules
// (invariants), 7 phases (epics), 28 tasks (stories, sprint-status.yaml),
// 35 automated checks (lib/**/*.test.ts).
// OPEN ITEM: the About Me hobbies row is a bracketed placeholder — fill it in.
// Still PULSE-strict: four working colors, 14pt floor, real title placeholders,
// text inside shapes, one grid. Light canvas; night-sky bookends only.
const pptxgen = require("pptxgenjs");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

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
  green: "047857",
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

(async () => {
  const heroBg = await png(constellationSvg(1920, 1080));
  const starCobalt = await png(starSvg("#1D4ED8", 96));
  const starNight = await png(starSvg("#9DB9FF", 96));
  // Real product, not a redrawing: /rate verdict + Best Bet card, captured from
  // the live site at 2x. Crop is verdict banner through the Best Bet card.
  const shot =
    "image/png;base64," +
    fs.readFileSync(path.join(__dirname, "rate-screenshot.png")).toString("base64");
  const SHOT_AR = 1480 / 1384; // h/w of the crop

  const pptx = new pptxgen();
  pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
  pptx.layout = "WIDE";
  pptx.author = "Ashley Libasci";
  pptx.title = "Rating careers like stocks — BMAD + AWS";

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
      { placeholder: { options: { name: "title", type: "title", x: 1.67, y: 2.15, w: 10, h: 1.1 }, text: "" } },
      { placeholder: { options: { name: "sub", type: "body", x: 1.67, y: 3.35, w: 10, h: 0.9 }, text: "" } },
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
    s.addText("Rating careers like stocks", {
      placeholder: "title", align: "center", fontFace: SANS, fontSize: 44, bold: true, color: "FFFFFF", margin: 0,
    });
    s.addText(
      "Exploring development with the BMAD AI agentic framework — and how to host a simple website on AWS.",
      { placeholder: "sub", align: "center", fontFace: SANS, fontSize: 18, color: C.nightMuted, margin: 0 },
    );
    s.addShape("rect", { x: 5.92, y: 5.28, w: 1.5, h: 0.016, fill: { color: C.nightAccent } });
    txt(s, [
      { text: "Ashley Libasci", options: { fontSize: 16, bold: true, color: C.nightText, breakLine: true } },
      { text: "CareerStar — live at ashleylibasci.com", options: { fontSize: 14, color: C.nightAccent, breakLine: true } },
      { text: "Capital One · August 6, 2026", options: { fontSize: 14, color: C.nightMuted } },
    ], { x: 3.17, y: 5.55, w: 7, h: 1.2, align: "center", lineSpacing: 24 });
    s.addNotes(
      "Hi, I'm Ashley. This summer I built a website that rates careers the way analysts rate stocks. Today I'll show you the site, then the two things I actually want to share: how I built it with a team of AI helpers, and how I put it on the internet with Amazon's cloud. No background needed — I'll explain everything as we go. (0:30)",
    );
  }

  // == 2 · ABOUT ME (light) =================================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "01 · About me");
    title(s, "Hi, I’m Ashley");
    const rows = [
      ["School", "University of Illinois Urbana-Champaign — I study math and computer science, class of ’27."],
      ["Right now", "Cybersecurity intern at BCU, and studying for my first AWS certification."],
      ["This summer", "I built CareerStar, a site that scores careers — it’s live at ashleylibasci.com. How it got built is what this talk is about."],
      ["Off the clock", "[ hobbies go here — two or three, in your own words ]"],
    ];
    let y = 2.5;
    for (const [label, value] of rows) {
      txt(s, [{ text: label, options: { fontSize: 20, bold: true, color: C.cobalt } }], { x: M, y, w: 3.3, h: 0.5 });
      txt(s, [{ text: value, options: { fontSize: 16, color: C.ink } }], { x: 4.3, y: y + 0.04, w: 8.33, h: 0.75 });
      rule(s, M, y + 0.82, CW);
      y += 1.06;
    }
    pageno(s, 2);
    s.addNotes(
      "Thirty seconds on me: I'm at UIUC studying math and computer science, class of '27. Right now I'm a cybersecurity intern at BCU and studying for my first AWS certification — both of those show up later in this talk. And this summer I built CareerStar. [Add a line about hobbies here.] (0:45)",
    );
  }

  // == 3 · WHAT IT DOES (light) ============================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "02 · What it does");
    title(s, "Type in careers, get a score out of 100 for each");
    // the real product — live /rate results, captured, not redrawn
    const shotH = 4.55, shotW = shotH / SHOT_AR; // ≈ 4.26
    s.addImage({ data: shot, x: M, y: 2.0, w: shotW, h: shotH });
    s.addShape("rect", {
      x: M - 0.02, y: 1.98, w: shotW + 0.04, h: shotH + 0.04,
      fill: { color: C.white, transparency: 100 }, line: { color: C.line, width: 1 },
    });
    txt(s, [{ text: "ashleylibasci.com/rate — the real site, as it looks today", options: { fontSize: 13, color: C.slate } }],
      { x: M, y: 6.62, w: shotW + 1.0, h: 0.3 });
    const facts = [
      ["730", "occupations scored — every job the U.S. Labor Department publishes numbers on: how many people do it, expected growth, typical pay"],
      ["5", "scoring formulas, each a different philosophy — switch live and see if the answer survives"],
      ["10%", "of careers get five stars — it’s graded on a curve, like fund ratings, so stars compare instead of flatter"],
    ];
    let y = 2.35;
    for (const [big, small] of facts) {
      txt(s, [{ text: big, options: { fontSize: 36, bold: true, color: C.cobalt } }], { x: 5.25, y: y - 0.08, w: 1.5, h: 0.62 });
      txt(s, [{ text: small, options: { fontSize: 16, color: C.ink } }], { x: 6.85, y: y + 0.02, w: 5.78, h: 0.75 });
      if (big !== "10%") rule(s, 5.25, y + 0.88, 7.38);
      y += 1.12;
    }
    rule(s, 5.25, 5.95, 7.38);
    txt(s, [
      { text: "The score is built from public data: how fast the career is growing, what it pays, and how much of the work AI can already do.", options: { fontSize: 15, color: C.ink } },
    ], { x: 5.25, y: 6.15, w: 7.38, h: 0.7 });
    pageno(s, 3);
    s.addNotes(
      "Let me show the product first so everything later has something to hang on. You type in the careers you're deciding between — say nursing versus software versus actuary — and each one gets a score out of 100. Higher means a stronger bet.\n\nWhere do the numbers come from? The U.S. government, mostly. The Bureau of Labor Statistics — the agency that tracks the job market — publishes data on about 730 occupations: how many people work in each one, how fast it's expected to grow over the next decade, and what it typically pays. A second government database, O*NET, describes the skills each job actually uses day to day. And a published research study estimated, job by job, how much of the work today's AI could already do. My site combines those public sources — I didn't collect anything myself, which is the point: you can check my inputs.\n\nWhy five formulas? Because my formula is one opinion about how to weigh all that, and reasonable people would weigh it differently. So the site ships five: the Standard one — my headline formula, reward marked down by AI risk. The Growth optimist — just growth and pay, deliberately ignoring AI, betting the official forecasts already account for it. The Defensive one — safety first: if AI hits hard, how sheltered is this career? The Efficiency one — reward per unit of risk; a career has to earn its risk. And the Plain average — it just averages everything, and it exists as the baseline: if my clever formula can't beat a plain average, I want to know. You can switch between them live, and when they disagree, that disagreement is real information about uncertainty.\n\nAnd the stars: they're graded on a curve, the way Morningstar rates mutual funds. Five stars doesn't mean 'nice job' — it means 'top 10 percent of all 730.' If most careers could get five stars, stars would mean nothing. Scarcity is what makes them information. (2:00)",
    );
  }

  // == 4 · THE MATH (light) ================================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "03 · The math");
    title(s, "The whole formula is four lines");
    txt(s, [
      { text: "The ingredients:  ", options: { fontSize: 14, bold: true, color: C.ink } },
      { text: "growth = how fast jobs are being added · pay = typical salary · AI = how much of the work AI can already do · volatility = how shaky the field’s outlook is · fit = match to your interests", options: { fontSize: 14, color: C.slate } },
    ], { x: M, y: 2.02, w: CW, h: 0.55 });
    const lines = [
      ["Return  =  ½ growth  +  ½ pay", "what you get — each as a rank against all 730, because you can’t average a percent with dollars"],
      ["Risk  =  0.7 AI  +  0.3 volatility", "what can shrink it — AI gets most of the weight, because AI risk is the whole point of the site"],
      ["Value  =  Return × (1 − 0.6 Risk)", "multiply, don’t subtract — so a big reward can’t hide a big risk. Risk erases 60% at most"],
      ["Score  =  70% Value  +  30% Fit", "then mix in how well it fits you — final score out of 100"],
    ];
    let y = 2.72;
    for (const [eq, gloss] of lines) {
      txt(s, [{ text: eq, options: { fontSize: 19, bold: true, color: C.ink } }], { x: M, y, w: 6.1, h: 0.5 });
      txt(s, [{ text: gloss, options: { fontSize: 14, color: C.slate } }], { x: 7.0, y: y + 0.04, w: 5.63, h: 0.62 });
      rule(s, M, y + 0.62, CW);
      y += 0.84;
    }
    card(s, [
      { text: "Honesty about the 0.7 and the 0.6: I picked them.  ", options: { fontSize: 15, bold: true, color: C.ink } },
      { text: "There’s no answer key for career choices, so there’s nothing to tune them against. Instead, the site re-computes every ranking 729 times with those numbers wiggled up and down, plus with five rival formulas — and when the answer flips, it says “close call” instead of pretending to be sure.", options: { fontSize: 15, color: C.slate } },
    ], { x: M, y: 6.12, w: CW, h: 1.05 });
    pageno(s, 4);
    s.addNotes(
      "The whole model is four lines, and I want to explain WHY each line looks the way it does — not just show it.\n\nLine one, Return. What do you actually get from a career? Two things the government measures: growth — will there be job openings when you graduate — and pay. Why half and half? Honest answer: I have no evidence that one matters more than the other, so I don't pretend to. Equal weights — and the site has sliders, so if you care more about pay than growth, you can shift it and watch the scores react. One catch before averaging: growth is a percent and pay is in dollars, and averaging a percent with dollars is meaningless. So first, every career gets a rank out of 730 on each ingredient — 'nursing is 74th percentile for growth' — and I combine ranks. That also matches the real question, which is never 'is nursing good in the abstract,' it's 'is nursing better than my alternatives.'\n\nLine two, Risk — what could shrink that return? Two things. AI: the share of the job's day-to-day tasks that today's AI could already do, from a published research study. And volatility: how shaky the field's outlook is. Small confession there — nobody publishes 'career volatility' data, so I built a stand-in: fields projected to shrink get treated as shakier. It's disclosed on the site. Why does AI get 0.7 of the weight? Because 'what does AI do to this career' is the entire question this site exists to answer — volatility is just the sanity check.\n\nLine three — why multiply instead of subtract? Picture a career with a huge reward and a huge risk. If you subtract, the big reward soaks up the risk and it still scores fine — the risk hides behind the paycheck. Multiplying discounts the reward IN PROPORTION to the risk, the way an investor risk-adjusts a return: double the risk, double the haircut. And the 0.6 caps the damage — even the riskiest career keeps at least 40% of its reward — because careers aren't stocks: they can't go to zero. People adapt, retrain, shift specialties.\n\nLine four: blend in fit, 70/30. Why does the market get 70? Because a job you'd love that's disappearing is still disappearing — reality has to dominate. But fit matters at the margins: between two close careers, you'll actually stay in the one that suits you.\n\nAnd the box at the bottom: the 0.7, the 0.6, the 70/30 — I picked them. There is no answer key of correct career choices to tune against, so instead of pretending precision, the site re-runs every ranking 729 times with those numbers wiggled up and down, plus under five rival formulas. When a ranking flips, the site says 'close call' instead of acting sure. (2:30)",
    );
  }

  // == 5 · TWO WAYS TO BUILD WITH AI (light) ===============================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "04 · Two ways to build with AI");
    title(s, "Same AI. Very different results.");
    txt(s, [{ text: "VIBE CODING", options: { fontSize: 15, bold: true, color: C.slate, charSpacing: 2.5 } }], { x: M, y: 2.25, w: COL, h: 0.32 });
    txt(s, [{ text: "chatting with an AI until something runs", options: { fontSize: 13, italic: true, color: C.slate } }], { x: M, y: 2.6, w: COL, h: 0.3 });
    txt(s, [{ text: "AGENTIC FRAMEWORK", options: { fontSize: 15, bold: true, color: C.cobalt, charSpacing: 2.5 } }], { x: COL2X, y: 2.25, w: COL, h: 0.32 });
    txt(s, [{ text: "a team of AI helpers, each with a job and a checklist", options: { fontSize: 13, italic: true, color: C.slate } }], { x: COL2X, y: 2.6, w: COL, h: 0.3 });
    rule(s, M, 2.98, COL);
    rule(s, COL2X, 2.98, COL, C.cobalt);
    const rows = [
      ["You prompt, paste, and hope", "A written plan exists before any code does"],
      ["You accept whatever runs", "35 automated checks re-run on every change"],
      ["One agreeable assistant", "Several AI reviewers whose only job is finding problems"],
      ["The AI does the math", "The math is a fixed formula — same inputs, same score, anyone can re-check it"],
      ["“Trust me, it works”", "The data, the code, and the test results are all public"],
    ];
    let y = 3.22;
    for (const [l, r] of rows) {
      txt(s, [{ text: l, options: { fontSize: 15, color: C.slate } }], { x: M, y, w: COL, h: 0.52, valign: "middle" });
      txt(s, [{ text: r, options: { fontSize: 15, bold: true, color: C.ink } }], { x: COL2X, y, w: COL, h: 0.52, valign: "middle" });
      y += 0.6;
    }
    rule(s, M, 6.35, CW);
    txt(s, [{ text: "The AI typed most of this project either way. The discipline around it is the difference.", options: { fontSize: 16, bold: true, color: C.ink } }],
      { x: M, y: 6.55, w: CW, h: 0.4 });
    pageno(s, 5);
    s.addNotes(
      "When people hear 'AI wrote most of my code,' they usually picture the left column — vibe coding. You chat with an AI, paste what it gives you, and hope. Honestly, that's fine for a weekend experiment. I did something different: an agentic framework. Instead of one chat, a team of AI helpers, each with a specific job and a checklist. A plan gets written before any code. Every change re-runs 35 automated checks — think of them as 35 little tests that each poke one part of the code and complain if it breaks. And separate AI reviewers exist purely to find problems with what got built.\n\nThe fourth row needs a careful explanation, because it sounds like a contradiction: 'the AI doesn't do the math' — didn't AI build this thing? The key is that there are two different moments. When I DESIGNED the site, AI absolutely helped: agents brainstormed with me, challenged me, and typed most of the code. But the formula itself is a human decision — I chose it, it's written down, it's fixed, and it's public. Then there's the second moment: when YOU visit the site and get a score. At that moment, no AI is involved at all. The site does plain arithmetic using that fixed formula. Why insist on that? Because an AI model is unpredictable — ask it the same question twice, you can get two different answers, and there's no way to audit why it 'felt like' a 73. Arithmetic gives the same answer every single time, and anyone can redo it by hand and catch me if it's wrong. So: AI helped write the recipe. It never gets to cook the numbers. (1:30)",
    );
  }

  // == 6 · BMAD (light) ====================================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "05 · BMAD");
    title(s, "BMAD: my AI team, and what each agent does");
    txt(s, [{ text: "BMAD is a free, open-source framework that turns AI into a small team — like a tiny software company where I’m the boss.", options: { fontSize: 15, color: C.slate } }],
      { x: M, y: 2.0, w: CW, h: 0.35 });
    const boxes = [
      ["PLAN", "A “product manager” agent grilled me with why-questions until we had a written plan. An “architect” agent set 7 rules the code must never break.", "1 written plan · 7 rules"],
      ["BUILD", "A “developer” agent wrote the code one small task at a time — 28 tasks, each with its own done-checklist and automated checks.", "7 phases · 28 tasks · 35 checks"],
      ["ATTACK", "A cast of AI reviewers argues over every change — a quality checker, a design critic, a fact-checker, one professional grump. I referee.", "every change gets reviewed"],
    ];
    let x = M;
    for (const [head, body, count] of boxes) {
      card(s, [
        { text: head, options: { fontSize: 19, bold: true, color: C.cobalt, charSpacing: 2, breakLine: true } },
        { text: "", options: { fontSize: 8, breakLine: true } },
        { text: body, options: { fontSize: 15, color: C.ink, breakLine: true } },
        { text: "", options: { fontSize: 8, breakLine: true } },
        { text: count, options: { fontSize: 14, bold: true, color: C.cobalt } },
      ], { x, y: 2.5, w: 3.55, h: 2.85, valign: "top", margin: 16 });
      x += 4.19;
    }
    s.addText("→", { x: 4.32, y: 3.65, w: 0.5, h: 0.5, align: "center", margin: 0, fontFace: SANS, fontSize: 24, bold: true, color: C.cobalt });
    s.addText("→", { x: 8.51, y: 3.65, w: 0.5, h: 0.5, align: "center", margin: 0, fontFace: SANS, fontSize: 24, bold: true, color: C.cobalt });
    rule(s, M, 5.62, CW);
    txt(s, [{ text: "The rule that mattered most —", options: { fontSize: 15, color: C.slate } }],
      { x: M, y: 5.8, w: CW, h: 0.3 });
    txt(s, [{ text: "“The AI never computes a number.”", options: { fontSize: 22, bold: true, color: C.cobalt } }],
      { x: M, y: 6.12, w: CW, h: 0.45 });
    txt(s, [{ text: "AI helped design the formula — but the live site never asks an AI for a number. Arithmetic can be checked; an AI’s guess can’t.", options: { fontSize: 14, color: C.slate } }],
      { x: M, y: 6.6, w: 11.0, h: 0.5 });
    pageno(s, 6);
    s.addNotes(
      "The framework I used is called BMAD. Think of it as a tiny software company where every employee is an AI and I'm the boss.\n\nFirst, planning. A 'product manager' agent interviewed me — it just kept asking why — until we had a real written plan. Then an 'architect' agent locked seven rules the code must never break. Since the slide just says 'seven rules,' here they are, quickly: One — the whole site is one app in one programming language, so there's no second system to maintain. Two — all the math lives in one module, and the screen only displays what it's given, so there's exactly one place any number can come from. Three — the government datasets get combined ahead of time into a single file, so the live site never assembles data on the fly; that keeps it fast and makes every result reproducible. Four — the AI explains, it never decides: it may phrase a paragraph about a score that's already computed, but no code path lets it produce or change a number. Five — anything a visitor types is treated as data, never as instructions; that's the security rule — it blocks the classic trick where someone types 'ignore your rules and do X,' and it caps input length and request rates. Six — no accounts, no database; nothing you type gets stored. Seven — hosting happens exactly one way, the AWS setup on the next slide, so there's no hand-built server to misconfigure.\n\nThen building: a 'developer' agent wrote the code one small task at a time — twenty-eight tasks, each with its own done-checklist — and the automated checks grew alongside, thirty-five in the end.\n\nAnd my favorite part, attack: a cast of AI reviewers argues about every change — a quality checker, a design critic, a fact-checker, and one whose entire personality is finding problems — and I referee.\n\nOn the big rule at the bottom — 'the AI never computes a number' — let me head off the obvious question: couldn't the AI have created the formula? Helped, yes — the agents debated it with me. But the formula is a human decision, written down and frozen. The rule is about the RUNNING site: it never asks an AI for a number, because a number an AI makes up can't be audited, and a fixed formula can. If a score is ever wrong, you can trace exactly why. (2:30)",
    );
  }

  // == 7 · AWS, PART 1: THE PIECES (light) =================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "06 · AWS, part 1");
    title(s, "Putting it on the internet: the three pieces");
    txt(s, [{ text: "“Hosting” just means: which computers serve your website to the world. I rent Amazon’s instead of running my own.", options: { fontSize: 15, color: C.slate } }],
      { x: M, y: 2.0, w: CW, h: 0.35 });
    const boxes = [
      ["THE CODE", "Lives on GitHub — a site where programmers keep their projects. My code there is just text files: instructions for a website, not a running one."],
      ["THE ENGINE", "AWS Amplify watches my GitHub. When I save a change, it follows those instructions, assembles the actual web pages, and runs them on Amazon’s computers."],
      ["THE ADDRESS", "Route 53 is the internet’s phone book: it turns the name ashleylibasci.com into the location of those computers. CloudFront keeps copies worldwide, for speed."],
    ];
    let x = M;
    for (const [head, body] of boxes) {
      card(s, [
        { text: head, options: { fontSize: 19, bold: true, color: C.cobalt, charSpacing: 2, breakLine: true } },
        { text: "", options: { fontSize: 8, breakLine: true } },
        { text: body, options: { fontSize: 15, color: C.ink } },
      ], { x, y: 2.5, w: 3.55, h: 2.55, valign: "top", margin: 16 });
      x += 4.19;
    }
    s.addText("→", { x: 4.32, y: 3.45, w: 0.5, h: 0.5, align: "center", margin: 0, fontFace: SANS, fontSize: 24, bold: true, color: C.cobalt });
    s.addText("→", { x: 8.51, y: 3.45, w: 0.5, h: 0.5, align: "center", margin: 0, fontFace: SANS, fontSize: 24, bold: true, color: C.cobalt });
    rule(s, M, 5.4, CW);
    txt(s, [{ text: "No servers to babysit, nothing to patch at 2 a.m. — Amazon handles that part, I handle my code.", options: { fontSize: 16, bold: true, color: C.ink } }],
      { x: M, y: 5.65, w: CW, h: 0.4 });
    txt(s, [{ text: "This setup is most of what the AWS Cloud Practitioner exam covers — I’m studying for it now, and this project made the flashcards real.", options: { fontSize: 14, italic: true, color: C.slate } }],
      { x: M, y: 6.15, w: CW, h: 0.4 });
    pageno(s, 7);
    s.addNotes(
      "Now the hosting half. 'Hosting' just means: which computers actually serve your website when someone visits. I rent Amazon's instead of running my own.\n\nPiece one, the code. It lives on GitHub — think of it as a shared drive for programmers, with full history. Important detail: what's on GitHub is just text files. Instructions for a website — not a running website. Something has to turn instructions into the real thing.\n\nThat's piece two, Amplify, and here's what 'turns it into a website' actually means. Amplify watches my GitHub. The moment I save a change, it does three things automatically: it BUILDS — follows my instructions and assembles the finished web pages and the little program that computes scores; it HOSTS — places all of that onto Amazon's computers; and it SWAPS — replaces the old version with the new one, with no downtime. I have never set up or even logged into a server. Saving my code IS the release.\n\nPiece three, the address. Here's the thing about the internet: computers don't find websites by name — they find them by numeric addresses, like street addresses. Route 53 is the phone book. It holds the entry that says 'ashleylibasci.com lives at these Amazon computers.' When you type my domain, your browser quietly looks it up there first, then goes to the right place. And CloudFront handles speed: it keeps copies of the site in cities all over the world, so someone in Tokyo gets served from near Tokyo instead of waiting for data to cross the ocean.\n\nThe part I appreciate most: there's nothing for me to babysit — no server to patch at 2 a.m. Amazon handles the machines; I handle my code. I'm studying for the AWS Cloud Practitioner cert right now, and honestly, this little site is what made the flashcard concepts real. (2:00)",
    );
  }

  // == 8 · AWS, PART 2: THE RECIPE (light) =================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "07 · AWS, part 2");
    title(s, "Want your own site? Here’s the whole recipe");
    const beats = [
      ["1", "Put your code on GitHub", "It’s free. Your project lives there, and it becomes the one true copy that Amazon watches."],
      ["2", "Connect AWS Amplify", "Point Amplify at your GitHub once. After that, every change you save goes live on its own — no servers to set up, ever."],
      ["3", "Add your own domain", "Buy a name you like, point it using Route 53, and Amplify sets up the padlock icon (the security certificate) for you."],
      ["4", "Then test it like a stranger", "The real internet behaves differently than your laptop. My spam protection passed every test at home — and never fired once out in the real world."],
    ];
    let y = 2.3;
    for (const [n, head, body] of beats) {
      txt(s, [{ text: n, options: { fontSize: 26, bold: true, color: C.cobalt } }], { x: M, y: y - 0.03, w: 0.5, h: 0.5 });
      txt(s, [{ text: head, options: { fontSize: 17, bold: true, color: C.ink } }], { x: 1.35, y, w: 2.9, h: 0.75 });
      txt(s, [{ text: body, options: { fontSize: 15, color: C.slate } }], { x: 4.4, y: y + 0.02, w: 8.23, h: 0.75 });
      rule(s, M, y + 0.84, CW);
      y += 1.04;
    }
    txt(s, [{ text: "Setting this up taught me more about AWS than the practice exams did.", options: { fontSize: 17, bold: true, color: C.ink } }],
      { x: M, y: 6.55, w: CW, h: 0.45, align: "center" });
    pageno(s, 8);
    s.addNotes(
      "If you want to do this yourselves, this is genuinely the entire recipe — four steps.\n\nStep one: put your code on GitHub. It's free, and it becomes the one true copy of your project — the thing Amazon will watch. Even if you've never coded, this is the same motion as putting a document in a shared drive.\n\nStep two: connect AWS Amplify to it. You do this once, in a web console — you click 'new app,' point it at your GitHub project, and that's the setup. From that moment on, every time you save a change, the live site updates itself a few minutes later. There is no step where you configure a server, because there is no server you can see.\n\nStep three: add your own domain. You buy a name you like — mine cost about as much as a pizza per year — tell Route 53 'this name belongs to this app,' and Amplify automatically sets up the padlock icon, the security certificate that makes browsers trust the site. That part used to be genuinely painful to do by hand; now it's a checkbox.\n\nStep four is the one nobody puts in tutorials: test it like a stranger. Open your site from your phone on cellular, from a friend's laptop, and try to misuse it. The real internet behaves differently than your laptop — there's Amazon machinery between you and your visitors that you can't see from home. My spam protection — the thing that stops someone from hammering the site with thousands of requests — passed every test on my laptop and then never fired once in the real world. Not once. There's a spare slide with that whole story if anyone wants it in Q&A — it's my favorite bug of the summer. (1:30)",
    );
  }

  // == 9 · CLOSING THOUGHTS (dark) =========================================
  {
    const s = pptx.addSlide({ masterName: "DARKCLOSE" });
    s.addImage({ data: starNight, x: 0.7, y: 0.55, w: 0.22, h: 0.23 });
    s.addText("What I’d tell you to steal", {
      placeholder: "title", align: "left", fontFace: SANS, fontSize: 30, bold: true, color: C.nightText, margin: 0,
    });
    const takes = [
      ["Write the plan before the prompt", "the discipline, not the AI, is what made this work"],
      ["Admit what your model gets wrong", "the awkward numbers earned more trust than the good ones"],
      ["Pick tools that make rigor fun — mine was BMAD", "review you enjoy is review you’ll actually do"],
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
      { text: "My model makes bets about the next decade — so in 2034 I’ll grade them against what really happened, and publish it.", options: { fontSize: 15, color: C.nightMuted, breakLine: true } },
      { text: "", options: { fontSize: 8, breakLine: true } },
      { text: "Ratings agencies should eat their own cooking.", options: { fontSize: 15, italic: true, bold: true, color: "6EE7B7" } },
    ], { x: 8.85, y: 2.4, w: 3.78, h: 3.4, fill: C.nightPanel, line: C.nightLine, valign: "top", margin: 18 });
    rule(s, M, 6.35, CW, C.nightAccent);
    txt(s, [{ text: "Thanks — questions?    ashleylibasci.com  ·  github.com/ashleylibasci/careerstar", options: { fontSize: 15, color: C.nightText } }],
      { x: M, y: 6.6, w: CW, h: 0.45, align: "center" });
    s.addNotes(
      "So, my honest takeaways. Write the plan before the prompt — the discipline, not the AI, is what made this work. Admit what your model gets wrong — the awkward numbers on my site earned more trust than the good ones. And pick tools that make rigor fun — mine was BMAD — because a review process you enjoy is one you'll actually do. Last thing: my model is making bets about the next ten years. So in 2034, I'll grade those bets against what really happened and publish the results, hits and misses. Ratings agencies should eat their own cooking. Thanks — happy to take questions. (0:45)",
    );
  }

  // == 10 · DIVIDER: END OF TALK ===========================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    txt(s, [{ text: "That’s the talk.", options: { fontSize: 34, bold: true, color: C.ink } }],
      { x: M, y: 3.0, w: CW, h: 0.6, align: "center" });
    txt(s, [{ text: "The slides after this one are spares — answers I prepared in case someone asks. They’re not part of the presentation.", options: { fontSize: 16, color: C.slate } }],
      { x: 2.7, y: 3.75, w: 7.93, h: 0.6, align: "center" });
    pageno(s, 10);
    s.addNotes("Stop here. Everything past this slide is only for Q&A — jump to whichever spare matches the question.");
  }

  // == 11 · SPARE: THE BUG STORY (light) ===================================
  {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "Spare · only if someone asks");
    title(s, "The spam blocker that never blocked anyone");
    const beats = [
      ["1", "What I built", "A limit on how fast any one visitor can hit the site — standard protection against spam and abuse. It keys off each visitor’s network address."],
      ["2", "What actually happened", "Out on the real internet: 30 rapid-fire requests, zero blocked. Every request looked like a brand-new visitor."],
      ["3", "Why", "Amazon’s own machinery sits between visitors and my site, and it stamps its own address onto every request — in the exact spot my code was reading. I was rate-limiting Amazon, not the visitor."],
      ["4", "The fix", "Read the address from the right spot, add an overall cap as a safety net, and add an automated check so it can never silently break that way again."],
    ];
    let y = 2.3;
    for (const [n, head, body] of beats) {
      txt(s, [{ text: n, options: { fontSize: 26, bold: true, color: C.cobalt } }], { x: M, y: y - 0.03, w: 0.5, h: 0.5 });
      txt(s, [{ text: head, options: { fontSize: 17, bold: true, color: C.ink } }], { x: 1.35, y, w: 2.9, h: 0.75 });
      txt(s, [{ text: body, options: { fontSize: 14, color: C.slate } }], { x: 4.4, y: y + 0.02, w: 8.23, h: 0.85 });
      rule(s, M, y + 0.92, CW);
      y += 1.12;
    }
    txt(s, [{ text: "Practice exams don’t teach you this. Production does.", options: { fontSize: 17, bold: true, color: C.cobalt } }],
      { x: M, y: 6.85, w: CW, h: 0.4, align: "center" });
    pageno(s, 11);
    s.addNotes(
      "The full bug story, if asked. I built rate limiting — a cap on how fast one visitor can hit the site. Textbook approach: identify visitors by network address, read from the standard spot in the request. In production: thirty rapid requests, zero blocked. Turns out Amazon's own infrastructure sits in the middle and stamps its own address in exactly the spot I was reading — so every request looked brand new. I was rate-limiting Amazon. The fix: read the right spot, add a global cap as a backstop, and pin it all down with an automated check. (1:30 if asked)",
    );
  }

  // == 12-14 · SPARES (light) ==============================================
  function backup(titleText, items, n) {
    const s = pptx.addSlide({ masterName: "LIGHT" });
    kicker(s, "Spare · only if someone asks");
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
  backup("About those judgment-call numbers", [
    ["“Why 0.7 and not 0.6?”", "Honest answer: I had to pick something, and there’s no data on “correct” career choices to tune against. So the site calls it a judgment call out loud, and stress-tests it — 729 re-scores with the numbers wiggled, five rival formulas, and “close call” labels whenever the answer flips."],
    ["“How do the stars work?”", "A forced curve, borrowed from how Morningstar rates funds: the top 10% of careers get five stars, the next 22.5% get four, and so on — recomputed live under whatever settings you choose."],
    ["“Isn’t ‘AI risk’ just another word for ‘declining job’?”", "Surprisingly, no. Across all 730 careers, AI exposure and projected growth are nearly unrelated — a job can be growing fast and still be very automatable. The AI number knows something growth doesn’t."],
  ], 12);
  backup("Did the formula actually work? I tested it on the past", [
    ["“What was the test?”", "I dug the government’s 2014 job projections out of an internet archive, scored 2014’s job market with today’s formula, and graded it against what really happened by 2024 — 647 occupations."],
    ["“How did it do?”", "Decent, honestly reported: it flagged 48% of the careers that truly declined (random guessing gets 33%). The government’s own plain projections narrowly beat my full formula — which makes sense, because my AI ingredient had nothing to price in 2014. Modern AI didn’t exist yet."],
    ["“Any fine print?”", "Yes, and it’s all published on the site: 2014 salary data wasn’t archived, so I used today’s salary order as a stand-in (it barely changes), and occupations that got reorganized between government coding systems drop out of the test."],
  ], 13);
  backup("The nuts and bolts", [
    ["“What’s it built with?”", "Next.js and TypeScript (a popular toolkit for building websites), hosted on AWS Amplify. 35 automated checks on the scoring code, scripts that rebuild every dataset from the original sources, and all of it — code and data — public on GitHub."],
    ["“What did the AI get wrong along the way?”", "Plenty — that’s why the reviewer agents exist. The best catch: my own methodology page claimed the fit score worked in a fancier way than the code actually did. The reviewers caught it, we rebuilt it properly, and the story of the catch is now published on the site."],
    ["“Does the big AI research back your AI ingredient?”", "My AI-risk data comes from a published 2023 study. Anthropic’s 2026 research layered real-world AI usage on the same foundation and found it held up — consistent with what my scores assume."],
  ], 14);
  backup("BMAD, up close", [
    ["“What does the framework actually leave behind?”", "A paper trail in the project: the written plan, the architecture doc with its 7 rules, all 28 tasks with their done-checklists, a status file tracking every task to finished, and the reviewers’ arguments — saved as files."],
    ["“Who are the reviewers?”", "AI personas the framework convenes on every change — a hiring manager, a fact-checker, a copy chief, a quality lead, a design critic, and one professional grump. And yes: this very deck went through that room."],
    ["“Would you use it again?”", "Yes. The habit is the transferable part — plan before prompt, hostile review before shipping — and that works with any AI tool. The framework just made the rigor feel like a game instead of a chore."],
  ], 15);

  await pptx.writeFile({ fileName: "/Users/ashleylibasci/ashleyaiproject/docs/CareerStar-CapitalOne-v10.pptx" });
  console.log("deck v10 (plain-language pass: every term explained, spares labeled) written");
})().catch((e) => { console.error(e); process.exit(1); });
