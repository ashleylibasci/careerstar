# I rated 730 careers like stocks. My model gave my own dream job no moat.

*DRAFT — Ashley's voice pass before posting. Suggested venues + intro lines per platform at
the bottom. Target length as-is: ~800 words (LinkedIn article / personal post / Show HN link
text).*

---

I'm a CS major, and like every CS major right now, I've had the 2 a.m. thought: *is AI going
to eat the job I'm training for?*

The internet's answer is either a pep talk or a doom score — some quiz that tells you
"software developer: 92% automatable!!" with no math behind it. Neither helped. So this
summer I built the thing I actually wanted: a model that rates careers the way Morningstar
rates stocks. Not "is this job safe" — that's the wrong question — but **"is this career a
good risk-adjusted bet?"**

The idea is simple finance: a career, like an asset, has expected **return** (projected
growth and pay, from real Bureau of Labor Statistics data) and **risk** (AI exposure from
published research, plus volatility). A field can be heavily exposed to AI and *still be
worth pursuing* if the growth, pay, and fit are strong enough — the same way a risky stock
can still belong in your portfolio. Every career gets a 0–100 risk-adjusted score, a star
rating on a forced curve (5★ = top 10% of all 730 occupations), and a Morningstar-style
"moat" — how *defensible* the career is against AI: few automatable tasks, built on skills
few other jobs have.

Then my model did something I didn't expect.

**It gave software developers — my own dream job — no moat.** Four and a half stars,
top-15% score… and zero defensibility. Because in the exposure data, coding is the single
most model-touchable kind of work there is. My first instinct was to tune it away. I didn't,
because the model was making a distinction I actually believe: *"will AI touch this work?"*
(yes, massively) is a different question from *"is this career worth pursuing?"* (also yes —
elite growth and pay, if you keep moving up the stack). Conflating those two questions is
exactly what the doom scores get wrong.

That wasn't even the most humbling moment. Halfway through, I caught my own methodology page
lying. It claimed fit was computed from "O\*NET skill vectors" — and when I actually read my
own data file, it was a keyword match wearing a lab coat. I rebuilt it for real: a
68-dimensional capability vector per occupation, cosine similarity, z-scored against the
whole labor market so *rare* skills count more than ones every job shares. The document
where I caught myself is committed in the repo, verdict by verdict, because "I found my own
model overclaiming and fixed it" turned out to be the most valuable thing I built all summer.

And because a formula is just an opinion, I stopped pretending mine was special: every
comparison on the site is also scored by **four rival models** — one that ignores AI risk
entirely, one where safety is everything, a Sharpe-style ratio, and a naive equal-weight
average as a control. When they agree, you can trust the ranking. When they crown different
winners, the site says so — because that disagreement *is* the answer: it means your decision
genuinely depends on how much you believe AI will reshape work.

Finally, the receipt. I back-tested it. BLS blocks scripted downloads of archived
projections, so I recovered the **2014–24 vintage from the Internet Archive**, scored the
2014 labor market with today's model, and compared against what actually happened — 647
occupations across a real decade. The score tracked reality (rank correlation 0.39; it
flagged 48% of the careers that actually declined, versus a 33% base rate). And the honest
part: the AI-risk adjustment added *nothing* for that decade — exactly as it should, because
2014–24 was a pre-LLM decade and exposure is a forward-looking bet. The misses are published
by name, starting with the oil-and-gas jobs my model liked in 2014 right before the price
crash. A back-test with no misses is marketing.

Everything is open: the methodology with every formula, all 730 ratings as a downloadable
CSV, and the code on GitHub. If a number looks wrong, check my math — that's the point.

**→ careerstar: https://main.d3ag7o87gtn2c8.amplifyapp.com** (try your own path — it'll show
you the bulls, the bears, and how five different models see it)

*Built solo in one summer — Math + CS @ UIUC, class of 2028.*

---

## Platform notes (delete before posting)

- **LinkedIn:** post as an article or long-form post; the OG card unfurls automatically.
  First line stands alone: "My model gave my own dream job no moat."
- **r/csMajors:** retitle to "I was anxious about AI taking CS jobs, so I built a model that
  rates careers like stocks. It rates software dev 4.5★ — but no moat." Lead with the 2 a.m.
  paragraph; keep it non-promotional, answer comments.
- **r/UIUC:** add "built by a UIUC sophomore over the summer" up top.
- **Show HN:** title "Show HN: CareerStar – career viability ratings with the math shown".
  HN will audit the CSV and the methodology — that's the feature.
