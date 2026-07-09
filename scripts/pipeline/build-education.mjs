// CareerStar education/ROI pipeline (offline).
// Streams the two large College Scorecard CSVs (gitignored, ~240 MB) + the NCES
// CIP->SOC crosswalk and emits a small committed data/education.json keyed by
// SOC: for each occupation, the real median earnings & debt of its feeder
// majors, the majors themselves, and a few selective schools that offer them.
// This is the "how do I get here, and is it worth it?" layer, joined to the
// occupation scores by SOC so it can never orphan.
//
// Run: node scripts/pipeline/build-education.mjs   (or: npm run build:education)

import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const SRC = join(ROOT, "data", "sources");
const GENERATED = "2026-07-09";

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
const num = (v) => { const n = Number(v); return Number.isFinite(n) && v !== "" ? n : null; };
const cip4 = (v) => String(v).replace(/\D/g, "").slice(0, 4);
const cleanMajor = (t) => t.replace(/,\s*(Other|General)$/i, "").replace(/\s{2,}/g, " ").trim();
const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

async function eachRow(file, onRow) {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let header = null;
  const idx = {};
  for await (const line of rl) {
    if (!header) {
      header = parseCsvLine(line);
      header.forEach((h, i) => (idx[h] = i));
      continue;
    }
    onRow(parseCsvLine(line), idx);
  }
}

// --- crosswalk: SOC -> [cip4], and reverse cip4 -> [soc] ---
const xwalk = JSON.parse(readFileSync(join(SRC, "cip_soc.json"), "utf8"));
const socToCip = xwalk.socToCip;
const cipTitles = xwalk.cipTitles;
const cipToSoc = new Map();
for (const [soc, cips] of Object.entries(socToCip)) {
  for (const c of cips) {
    if (!cipToSoc.has(c)) cipToSoc.set(c, []);
    cipToSoc.get(c).push(soc);
  }
}

// --- 1. institutions: keep selective 4-year schools (SAT_AVG present) ---
const school = new Map(); // unitid -> {name,state,cost,earn10,admRate,satAvg}
await eachRow(join(SRC, "Most-Recent-Cohorts-Institution.csv"), (c, idx) => {
  const sat = num(c[idx.SAT_AVG]);
  if (sat === null) return; // selective 4-year proxy
  school.set(c[idx.UNITID], {
    name: c[idx.INSTNM],
    state: c[idx.STABBR],
    cost: num(c[idx.COSTT4_A]),
    earn10: num(c[idx.MD_EARN_WNE_P10]),
    admRate: num(c[idx.ADM_RATE]),
    satAvg: sat,
  });
});
console.log(`Selective 4-yr schools: ${school.size}`);

// --- 2. field of study: bachelor's programs -> accumulate per SOC ---
const acc = new Map(); // soc -> {earn:[], debt:[], majors:Set, unitids:Set, programs:n}
const bump = (soc) => {
  if (!acc.has(soc)) acc.set(soc, { earn: [], debt: [], majors: new Set(), unitids: new Set(), programs: 0 });
  return acc.get(soc);
};
await eachRow(join(SRC, "Most-Recent-Cohorts-Field-of-Study.csv"), (c, idx) => {
  if (c[idx.CREDLEV] !== "3") return; // bachelor's degree only
  const key = cip4(c[idx.CIPCODE]);
  const socs = cipToSoc.get(key);
  if (!socs) return;
  const earn = num(c[idx.EARN_MDN_HI_1YR]);
  const debt = num(c[idx.DEBT_ALL_STGP_ANY_MDN]);
  const unitid = c[idx.UNITID];
  const selective = school.has(unitid);
  for (const soc of socs) {
    const a = bump(soc);
    a.programs++;
    if (earn !== null) a.earn.push(earn);
    if (debt !== null) a.debt.push(debt);
    if (cipTitles[key]) a.majors.add(cleanMajor(cipTitles[key]));
    if (selective && a.unitids.size < 60) a.unitids.add(unitid);
  }
});

// --- 3. emit per-SOC ROI summary ---
const education = {};
for (const [soc, a] of acc) {
  if (a.earn.length === 0) continue;
  const schools = [...a.unitids]
    .map((u) => ({ unitid: u, ...school.get(u) }))
    .filter((s) => s.earn10 !== null)
    .sort((x, y) => (x.admRate ?? 1) - (y.admRate ?? 1) || (y.satAvg ?? 0) - (x.satAvg ?? 0))
    .slice(0, 6)
    .map((s) => ({ name: s.name, state: s.state, cost: s.cost, earn10: s.earn10, admRate: s.admRate }));
  education[soc] = {
    earn1yr: median(a.earn),
    debt: median(a.debt),
    programs: a.programs,
    majors: [...a.majors].slice(0, 5),
    schools,
  };
}

const out = {
  meta: {
    generated: GENERATED,
    socCount: Object.keys(education).length,
    note: "Per-occupation education ROI from College Scorecard (bachelor's programs), joined by the NCES CIP2020->SOC2018 crosswalk. earn1yr/debt are medians across feeder majors; schools are selective institutions offering them.",
    sources: {
      earnings: { name: "U.S. Dept. of Education, College Scorecard (Field of Study + Institution, most recent)", license: "Public domain" },
      crosswalk: { name: "NCES CIP 2020 → SOC 2018 Crosswalk", url: "https://nces.ed.gov/ipeds/cipcode", license: "Public domain" },
    },
  },
  education,
};
writeFileSync(join(ROOT, "data", "education.json"), JSON.stringify(out) + "\n", "utf8");
console.log(`Wrote data/education.json — ${Object.keys(education).length} occupations with ROI data.`);
