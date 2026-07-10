# CareerStar — Launch & Evidence Checklist

The site is feature-complete. What makes it *stand out to recruiters* now is **evidence**:
real users, real feedback, real validation. This is the playbook.

---

## 1. The feedback loop is live (already built)

Every score card and career report has a **"Was this rating fair? 👍👎"** widget. Votes are
zero-PII (occupation code + verdict + timestamp only) and logged as structured lines that
Amplify captures in CloudWatch.

**To read the results:**
1. AWS Console → Amplify → your app → **Hosting → Compute logs** (opens CloudWatch).
2. In CloudWatch **Logs Insights**, run:
   ```
   fields @timestamp, @message
   | filter @message like /rating-feedback/
   | parse @message '"code":"*"' as code
   | parse @message '"fair":*,' as fair
   | stats count(*) as votes, sum(fair="true") as fair_votes by code
   | sort votes desc
   ```
3. The careers where users most disagree with the model = your next case-study chapter:
   *"Here's where 1,000 users said my model was wrong, and what I did about it."*

## 2. Where to post (in order)

| Where | What to say | Why |
|---|---|---|
| **LinkedIn** | The essay hook: *"I rated 730 careers like stocks. My model gave my own dream job no moat."* + link | Recruiters live here; OG cards unfurl |
| **r/csMajors** | "I built a data-grounded career-viability rater because I was anxious about AI taking CS jobs. It rates software dev 4.5★ but no moat — here's why." | Your exact audience + their exact anxiety |
| **r/UIUC** | Same, campus-flavored ("built by a UIUC sophomore") | Local proof, career-center attention |
| **UIUC career center / advisors** | Short email + link, offer it as a free tool | An institutional user is gold on a resume |
| **Hacker News (Show HN)** | "Show HN: CareerStar – career viability ratings with the math shown" | Engineers audit it; the open CSV + methodology survive scrutiny |

**Posting tips:** lead with the honest hook (no-moat software devs / the bug you caught), not
the feature list. Reply to every comment for the first 24h — comments are user research.

## 3. Track the numbers that matter

- Votes per day (CloudWatch query above) and the fair/unfair split per career.
- Which careers get visited (Amplify access logs) — the reports people share.
- Screenshot the spikes. **"X people used it in week one"** goes on the resume and in the
  case study the moment it's true.

## 4. Then close the loop (the differentiator)

After ~2 weeks of feedback: analyze disagreements → adjust or *defend* the model (both are
wins) → add a "What users taught me" section to the case study → post the follow-up. A
shipped→measured→learned→iterated cycle is what separates a product from a project.

## 5. The back-test (the crown jewel — see BACKTEST_PREP.md)

One manual download unlocks it. Instructions in `BACKTEST_PREP.md`.
