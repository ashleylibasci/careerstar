import type { Occupation } from "./types";

// Free-text → candidate occupations + interest signals (Story 2.3).
// Deterministic keyword/alias matching over the MVP occupation set — no LLM
// (the LLM never touches the scoring path). A later story can swap in a richer
// occupation resolver without changing this module's contract.

// Alias phrase (lowercase substring) → O*NET-SOC code(s) in the dataset.
const ALIASES: Record<string, string[]> = {
  "software engineer": ["15-1252.00"],
  "software develop": ["15-1252.00"],
  "software": ["15-1252.00"],
  swe: ["15-1252.00"],
  developer: ["15-1252.00"],
  "programmer": ["15-1251.00"],
  programming: ["15-1252.00"],
  coding: ["15-1252.00"],
  "computer science": ["15-1252.00", "15-1221.00"],
  "web develop": ["15-1254.00"],
  "front-end": ["15-1254.00"],
  frontend: ["15-1254.00"],
  "ux": ["15-1255.00"],
  "ui design": ["15-1255.00"],
  designer: ["15-1255.00"],
  "data scien": ["15-2051.00"],
  "data analy": ["15-2051.00"],
  "machine learning": ["15-2051.00", "15-1221.00"],
  "ml engineer": ["15-2051.00"],
  "ai research": ["15-1221.00"],
  "research scientist": ["15-1221.00"],
  "artificial intelligence": ["15-1221.00", "15-2051.00"],
  statistic: ["15-2041.00"],
  mathematician: ["15-2021.00"],
  "applied math": ["15-2031.00", "15-2021.00"],
  math: ["15-2021.00", "15-2041.00"],
  "operations research": ["15-2031.00"],
  optimization: ["15-2031.00"],
  actuar: ["15-2011.00"],
  quantitative: ["15-2031.00", "15-2051.00", "15-2011.00"],
  quant: ["15-2031.00", "15-2051.00", "15-2011.00", "13-2051.00"],
  cybersecurity: ["15-1212.00"],
  "cyber security": ["15-1212.00"],
  security: ["15-1212.00"],
  infosec: ["15-1212.00"],
  network: ["15-1244.00", "15-1241.00"],
  sysadmin: ["15-1244.00"],
  database: ["15-1243.00", "15-1242.00"],
  "systems analyst": ["15-1211.00"],
  "it support": ["15-1232.00"],
  "help desk": ["15-1232.00"],
  finance: ["13-2051.00"],
  "financial analyst": ["13-2051.00"],
  investment: ["13-2051.00"],
  investing: ["13-2051.00"],
  "financial advisor": ["13-2052.00"],
  account: ["13-2011.00"],
  audit: ["13-2011.00"],
  econom: ["19-3011.00"],
  hardware: ["17-2061.00"],
  "electrical eng": ["17-2071.00"],
  "industrial eng": ["17-2112.00"],
  "engineering manager": ["11-9041.00"],
  "it manager": ["11-3021.00"],
  "information systems manager": ["11-3021.00"],
  qa: ["15-1253.00"],
  "quality assurance": ["15-1253.00"],
  testing: ["15-1253.00"],
};

export interface ParsedInput {
  /** Occupation codes the user's text points at (deduped, order-preserved). */
  candidateCodes: string[];
  /** Interest/skill tokens found, for fit scoring. */
  interests: string[];
}

/** Parse free text into candidate occupation codes + interest tokens. */
export function parseInput(text: string, dataset: Occupation[]): ParsedInput {
  const lower = text.toLowerCase();

  // Candidate occupations from alias matches.
  const codes: string[] = [];
  for (const [phrase, mapped] of Object.entries(ALIASES)) {
    if (lower.includes(phrase)) {
      for (const code of mapped) if (!codes.includes(code)) codes.push(code);
    }
  }

  // Interests = any known skill tag that appears in the text.
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
