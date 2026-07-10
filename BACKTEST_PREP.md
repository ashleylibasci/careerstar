# Back-test prep — the 2-minute download that unlocks the crown jewel

**The question the back-test answers:** *if CareerStar's model had existed in 2014, would it
have flagged the careers that actually declined by 2024?* No student project has this. It
turns "grounded estimate" into "validated against a decade of ground truth."

**Why you have to do the download:** BLS blocks automated/scripted downloads (403), but a
normal browser works fine. It's one file.

## What to download

The **BLS 2014–24 Employment Projections** occupation table (the decade-old counterpart of
the file already in `data/sources/`):

1. Go to **bls.gov/emp** → *Tables* → look for the **archived projections** (older vintages
   are linked from the Employment Projections tables/archives page).
2. You want the 2014–24 vintage of the occupational projections table — usually
   **"Table 1.2 Occupational projections and worker characteristics, 2014–24"** (xlsx).
   If the archive page is hard to find, search:
   `bls.gov "Table 1.2" occupational projections 2014-24 xlsx`
3. Any file with, per occupation (SOC code): **2014 employment** and **projected 2024
   employment** (or projected percent change 2014–24) is exactly right. XLSX or CSV both fine.

## Where to put it

Save it as:

```
data/sources/bls_projections_2014_24.xlsx     (or .csv — either works)
```

Then say the word, and the build proceeds:

## What gets built once the file lands (no further input needed)

1. **Join** 2014-vintage projections to today's data by SOC code.
2. **Ground truth:** the *actual* 2024 employment per occupation is already in
   `data/sources/bls_employment_projections.csv` (the 2024–34 file's base year) — so the
   test compares *2014's predicted decade* against *the decade that actually happened*.
3. **Score the 2014 market with today's model** (growth/pay percentiles from the 2014
   vintage; exposure held at measured values, disclosed as a limitation).
4. **Report, honestly:** hit rate on decliners (did low scores predict actual decline?),
   rank correlation between 2014 scores and realized 2014→2024 growth, the confusion
   matrix, **and the misses, named** — a back-test without misses is marketing.
5. **Publish** on `/methodology` (new "Back-test" section with the real numbers) and a
   "Validated against a decade" beat in the case study + talking points.
