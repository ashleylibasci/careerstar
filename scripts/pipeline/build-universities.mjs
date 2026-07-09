// CareerStar university pipeline (offline).
// Streams the two large College Scorecard CSVs (gitignored, ~240 MB) and emits
// a small committed data/universities.json: the top ~200 most-selective
// four-year universities + their bachelor's programs with real earnings & debt.
//
// Run: node scripts/pipeline/build-universities.mjs  (or: npm run build:universities)

import { createReadStream, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const SRC = join(ROOT, "data", "sources");
const GENERATED = "2026-07-09";
const TOP_N = 200;

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

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

async function eachRow(file, onRow) {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  let header = null;
  for await (const line of rl) {
    if (!header) { header = parseCsvLine(line); continue; }
    onRow(parseCsvLine(line), header);
  }
}

function idx(header, name) {
  const i = header.indexOf(name);
  if (i === -1) throw new Error(`column not found: ${name}`);
  return i;
}

// --- 1. Institutions: keep selective 4-year schools, rank, take top N ---
const schools = [];
await eachRow(join(SRC, "Most-Recent-Cohorts-Institution.csv"), (c, h) => {
  const sat = num(c[idx(h, "SAT_AVG")]);
  const adm = num(c[idx(h, "ADM_RATE")]);
  if (sat === null) return; // selective 4-year proxy
  schools.push({
    unitid: c[idx(h, "UNITID")],
    name: c[idx(h, "INSTNM")],
    city: c[idx(h, "CITY")],
    state: c[idx(h, "STABBR")],
    admRate: adm,
    satAvg: sat,
    cost: num(c[idx(h, "COSTT4_A")]),
    earn10: num(c[idx(h, "MD_EARN_WNE_P10")]),
    control: c[idx(h, "CONTROL")],
  });
});

schools.sort((a, b) => b.satAvg - a.satAvg || (a.admRate ?? 1) - (b.admRate ?? 1));
const top = schools.slice(0, TOP_N);
const topIds = new Set(top.map((s) => s.unitid));

// --- 2. Field of study: bachelor's programs at the top schools, with earnings ---
const programs = [];
await eachRow(join(SRC, "Most-Recent-Cohorts-Field-of-Study.csv"), (c, h) => {
  if (c[idx(h, "CREDLEV")] !== "3") return; // bachelor's only
  const unitid = c[idx(h, "UNITID")];
  if (!topIds.has(unitid)) return;
  const earnings = num(c[idx(h, "EARN_MDN_HI_1YR")]);
  if (earnings === null) return;
  programs.push({
    unitid,
    cip: c[idx(h, "CIPCODE")],
    cipDesc: c[idx(h, "CIPDESC")],
    earnings,
    debt: num(c[idx(h, "DEBT_ALL_STGP_ANY_MDN")]),
  });
});

const data = {
  meta: {
    generated: GENERATED,
    universityCount: top.length,
    programCount: programs.length,
    note: "Top ~200 most-selective four-year universities (by SAT average) and their bachelor's-level programs. Earnings are median 1 year after completion for federally-aided graduates — not all students.",
    source: "U.S. Dept. of Education, College Scorecard (public domain).",
  },
  universities: top.map((s) => ({
    unitid: s.unitid,
    name: s.name,
    city: s.city,
    state: s.state,
    admRate: s.admRate,
    satAvg: s.satAvg,
    cost: s.cost,
    earn10: s.earn10,
    control: s.control,
  })),
  programs,
};

writeFileSync(join(ROOT, "data", "universities.json"), JSON.stringify(data) + "\n", "utf8");
console.log(`Wrote data/universities.json — ${top.length} universities, ${programs.length} bachelor's programs.`);
console.log(`  top 3 by SAT: ${top.slice(0, 3).map((s) => `${s.name} (${s.satAvg})`).join(", ")}`);
