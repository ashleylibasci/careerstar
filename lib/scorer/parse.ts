import type { Occupation } from "./types";

// Free-text → candidate occupations + interest signals (Stories 2.3 / Wave 2).
// Deterministic keyword/alias matching over the occupation set — no LLM.

// Alias phrase (lowercase substring) → O*NET-SOC code(s) in the dataset.
const ALIASES: Record<string, string[]> = {
  // Software / CS
  "software engineer": ["15-1252.00"],
  "software develop": ["15-1252.00"],
  software: ["15-1252.00"],
  swe: ["15-1252.00"],
  developer: ["15-1252.00"],
  programmer: ["15-1251.00"],
  programming: ["15-1252.00"],
  coding: ["15-1252.00"],
  "computer science": ["15-1252.00", "15-1221.00"],
  "web develop": ["15-1254.00"],
  frontend: ["15-1254.00"],
  "qa": ["15-1253.00"],
  "quality assurance": ["15-1253.00"],
  // Data / math / research
  "data scien": ["15-2051.00"],
  "data analy": ["15-2051.00"],
  "machine learning": ["15-2051.00", "15-1221.00"],
  "ai research": ["15-1221.00"],
  "artificial intelligence": ["15-1221.00", "15-2051.00"],
  "research scientist": ["15-1221.00"],
  statistic: ["15-2041.00"],
  mathematician: ["15-2021.00"],
  math: ["15-2021.00", "15-2041.00"],
  "operations research": ["15-2031.00"],
  actuar: ["15-2011.00"],
  quantitative: ["15-2031.00", "15-2051.00", "15-2011.00"],
  quant: ["15-2031.00", "15-2051.00", "15-2011.00", "13-2051.00"],
  economi: ["19-3011.00"],
  // Security / systems
  cybersecurity: ["15-1212.00"],
  "cyber security": ["15-1212.00"],
  security: ["15-1212.00"],
  infosec: ["15-1212.00"],
  network: ["15-1244.00"],
  sysadmin: ["15-1244.00"],
  database: ["15-1243.00"],
  "systems analyst": ["15-1211.00"],
  // Engineering / architecture
  "mechanical eng": ["17-2141.00"],
  "civil eng": ["17-2051.00"],
  "electrical eng": ["17-2071.00"],
  "aerospace": ["17-2011.00"],
  "biomedical": ["17-2031.00"],
  "hardware eng": ["17-2061.00"],
  engineer: ["17-2141.00", "17-2051.00", "17-2071.00"],
  architect: ["17-1011.00"],
  // Business / finance
  finance: ["13-2051.00"],
  "financial analyst": ["13-2051.00"],
  investment: ["13-2051.00"],
  investing: ["13-2051.00"],
  "financial advisor": ["13-2052.00"],
  "financial manager": ["11-3031.00"],
  account: ["13-2011.00"],
  audit: ["13-2011.00"],
  consult: ["13-1111.00"],
  "management analyst": ["13-1111.00"],
  "market research": ["13-1161.00"],
  marketing: ["11-2021.00", "13-1161.00"],
  "human resources": ["13-1071.00"],
  "hr ": ["13-1071.00"],
  // Law
  lawyer: ["23-1011.00"],
  attorney: ["23-1011.00"],
  "law school": ["23-1011.00"],
  legal: ["23-1011.00", "23-2011.00"],
  paralegal: ["23-2011.00"],
  // Healthcare
  "nurse practitioner": ["29-1171.00"],
  nurse: ["29-1141.00", "29-1171.00"],
  nursing: ["29-1141.00"],
  pharmacist: ["29-1051.00"],
  pharmacy: ["29-1051.00"],
  "physical therap": ["29-1123.00"],
  physician: ["29-1215.00", "29-1071.00"],
  doctor: ["29-1215.00"],
  "pre-med": ["29-1215.00"],
  premed: ["29-1215.00"],
  "physician assistant": ["29-1071.00"],
  "medical assistant": ["31-9092.00"],
  psycholog: ["19-3033.00"],
  veterinar: ["29-1131.00"],
  "vet ": ["29-1131.00"],
  "medical scien": ["19-1042.00"],
  // Science
  chemist: ["19-2031.00"],
  chemistry: ["19-2031.00"],
  biolog: ["19-1042.00"],
  "environmental scien": ["19-2041.00"],
  // Education / social
  teacher: ["25-2021.00", "25-2031.00"],
  teaching: ["25-2021.00", "25-2031.00"],
  "elementary": ["25-2021.00"],
  professor: ["25-2031.00"],
  "social work": ["21-1021.00"],
  counselor: ["21-1012.00"],
  counseling: ["21-1012.00"],
  // Creative / media
  "graphic design": ["27-1024.00"],
  "interior design": ["27-1025.00"],
  design: ["27-1024.00", "15-1254.00"],
  writer: ["27-3043.00"],
  writing: ["27-3043.00"],
  author: ["27-3043.00"],
  editor: ["27-3041.00"],
  journalis: ["27-3043.00"],
  "public relations": ["27-3031.00"],
  "pr ": ["27-3031.00"],
  film: ["27-2012.00"],
  director: ["27-2012.00"],
  // Trades / construction / protective / other
  electrician: ["47-2111.00"],
  plumber: ["47-2152.00"],
  hvac: ["49-9021.00"],
  "construction manager": ["11-9021.00"],
  police: ["33-3051.00"],
  "law enforcement": ["33-3051.00"],
  firefighter: ["33-2011.00"],
  "insurance": ["41-3021.00"],
  "real estate": ["41-9022.00"],
  pilot: ["53-2011.00"],
  aviation: ["53-2011.00"],
  chef: ["35-1011.00"],
  culinary: ["35-1011.00"],
  cooking: ["35-1011.00"],
};

export interface ParsedInput {
  candidateCodes: string[];
  interests: string[];
}

const TITLE_STOP = new Set([
  "and", "the", "for", "with", "all", "other", "occupations", "workers", "worker",
  "general", "including", "not", "specialists", "managers", "assistants", "operators",
]);

/** Parse free text into candidate occupation codes + interest tokens. */
export function parseInput(text: string, dataset: Occupation[]): ParsedInput {
  const lower = text.toLowerCase();

  const codes: string[] = [];
  for (const [phrase, mapped] of Object.entries(ALIASES)) {
    if (lower.includes(phrase)) {
      for (const code of mapped) if (!codes.includes(code)) codes.push(code);
    }
  }

  // Match user words against occupation-title words by 5-char prefix, so
  // "welder" finds "Welders…" and "nurse" finds "…Nurses" across the full set.
  const userWords = lower
    .replace(/[^a-z\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 5 && !TITLE_STOP.has(w));
  if (userWords.length) {
    for (const occ of dataset) {
      const titleWords = occ.title
        .toLowerCase()
        .replace(/[^a-z\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 5 && !TITLE_STOP.has(w));
      const hit = titleWords.some((tw) =>
        userWords.some((uw) => {
          const [short, long] = uw.length <= tw.length ? [uw, tw] : [tw, uw];
          return short.length >= 5 && long.startsWith(short);
        }),
      );
      if (hit && !codes.includes(occ.code)) codes.push(occ.code);
    }
  }

  const allSkills = new Set<string>();
  for (const occ of dataset) for (const s of occ.skills) allSkills.add(s);
  const interests: string[] = [];
  for (const skill of allSkills) {
    if (lower.includes(skill.toLowerCase()) && !interests.includes(skill)) {
      interests.push(skill);
    }
  }

  return { candidateCodes: codes, interests };
}
