// O*NET capability-space: the shared vocabulary CareerStar uses to measure FIT.
//
// Every occupation carries a 68-dimensional CAPABILITY vector — the real O*NET
// 29.0 importance ratings (1–5) for 35 Skills + 33 Knowledge areas, produced by
// the offline pipeline. Skills (Critical Thinking, Programming…) are generic work
// activities; Knowledge (Economics & Accounting, Engineering, Medicine…) carries
// the DOMAIN signal that distinguishes, say, finance from engineering. Using both
// is what makes fit discriminate within the cognitive professions, not just
// cognitive-vs-manual.
//
// To score fit we turn the user's stated interests into a vector in the SAME
// 68-d space (via INTEREST_LEXICON), z-score each occupation against the labor
// market so ubiquitous capabilities count for little, and take the market-relative
// overlap. That is the honest meaning of "fit in O*NET skill-space."
//
// The lexicon is deliberately EXPLICIT and hand-authored (same philosophy as the
// scorer weights): every interest→capability mapping is auditable and tunable
// here, and documented on the methodology page. It is a modeling choice, stated
// as such — not ground truth.

/** The 35 O*NET Skill elements (generic work skills), canonical order. */
export const SKILL_ELEMENTS = [
  "Active Learning", "Active Listening", "Complex Problem Solving", "Coordination",
  "Critical Thinking", "Equipment Maintenance", "Equipment Selection", "Installation",
  "Instructing", "Judgment and Decision Making", "Learning Strategies",
  "Management of Financial Resources", "Management of Material Resources",
  "Management of Personnel Resources", "Mathematics", "Monitoring", "Negotiation",
  "Operation and Control", "Operations Analysis", "Operations Monitoring", "Persuasion",
  "Programming", "Quality Control Analysis", "Reading Comprehension", "Repairing",
  "Science", "Service Orientation", "Social Perceptiveness", "Speaking",
  "Systems Analysis", "Systems Evaluation", "Technology Design", "Time Management",
  "Troubleshooting", "Writing",
] as const;

/** The 33 O*NET Knowledge elements (domain knowledge), canonical order. */
export const KNOWLEDGE_ELEMENTS = [
  "Administration and Management", "Administrative", "Biology", "Building and Construction",
  "Chemistry", "Communications and Media", "Computers and Electronics",
  "Customer and Personal Service", "Design", "Economics and Accounting",
  "Education and Training", "Engineering and Technology", "English Language", "Fine Arts",
  "Food Production", "Foreign Language", "Geography", "History and Archeology",
  "Law and Government", "Mathematics", "Mechanical", "Medicine and Dentistry",
  "Personnel and Human Resources", "Philosophy and Theology", "Physics",
  "Production and Processing", "Psychology", "Public Safety and Security",
  "Sales and Marketing", "Sociology and Anthropology", "Telecommunications",
  "Therapy and Counseling", "Transportation",
] as const;

/**
 * Combined capability space. Skills and Knowledge each own a "Mathematics"
 * element; keeping both is intentional (skill-Mathematics = doing math;
 * knowledge-Mathematics = knowing math) and harmless to cosine. Vector index =
 * position in this array.
 */
export const CAPABILITY_ELEMENTS = [...SKILL_ELEMENTS, ...KNOWLEDGE_ELEMENTS] as const;
export const CAPABILITY_COUNT = CAPABILITY_ELEMENTS.length;

const CAP_INDEX: Record<string, number> = {};
CAPABILITY_ELEMENTS.forEach((name, i) => {
  // First occurrence wins (skill-Mathematics at its skills index); the knowledge
  // "Mathematics" is addressed explicitly below where domain intent matters.
  if (!(name in CAP_INDEX)) CAP_INDEX[name] = i;
});
const KNOW_MATH_INDEX = SKILL_ELEMENTS.length + KNOWLEDGE_ELEMENTS.indexOf("Mathematics");

/**
 * Interest / field token → the O*NET capabilities it implies. Keys are lowercase
 * and cover both the app's interest chips and the words people type. Knowledge
 * areas (capitalized domains) carry most of the domain discrimination; skills
 * round out the profile. A multi-word interest is matched whole first, then
 * word-by-word.
 */
export const INTEREST_LEXICON: Record<string, string[]> = {
  math: ["Mathematics", "Complex Problem Solving", "Critical Thinking"],
  mathematics: ["Mathematics", "Complex Problem Solving", "Critical Thinking"],
  calculus: ["Mathematics", "Complex Problem Solving"],
  statistics: ["Mathematics", "Critical Thinking", "Systems Analysis"],
  quantitative: ["Mathematics", "Systems Analysis", "Critical Thinking"],
  data: ["Mathematics", "Computers and Electronics", "Systems Analysis", "Critical Thinking"],
  analytics: ["Systems Analysis", "Computers and Electronics", "Mathematics"],
  analysis: ["Critical Thinking", "Systems Analysis", "Operations Analysis"],
  programming: ["Programming", "Computers and Electronics", "Complex Problem Solving"],
  coding: ["Programming", "Computers and Electronics", "Complex Problem Solving"],
  software: ["Programming", "Computers and Electronics", "Technology Design", "Complex Problem Solving"],
  computer: ["Computers and Electronics", "Programming", "Technology Design"],
  developer: ["Programming", "Computers and Electronics", "Systems Analysis"],
  technology: ["Computers and Electronics", "Engineering and Technology", "Technology Design"],
  tech: ["Computers and Electronics", "Technology Design", "Engineering and Technology"],
  technical: ["Engineering and Technology", "Technology Design", "Troubleshooting"],
  engineering: ["Engineering and Technology", "Physics", "Mathematics", "Technology Design", "Complex Problem Solving"],
  science: ["Chemistry", "Biology", "Physics", "Science", "Critical Thinking"],
  research: ["Science", "Active Learning", "Critical Thinking", "Reading Comprehension"],
  chemistry: ["Chemistry", "Science"],
  biology: ["Biology", "Science"],
  physics: ["Physics", "Mathematics", "Science"],
  writing: ["Writing", "English Language", "Reading Comprehension"],
  editing: ["Writing", "English Language", "Critical Thinking"],
  reading: ["Reading Comprehension", "English Language"],
  communication: ["Communications and Media", "Speaking", "Active Listening"],
  speaking: ["Speaking", "Active Listening", "Communications and Media"],
  teaching: ["Education and Training", "Instructing", "Speaking"],
  education: ["Education and Training", "Instructing", "Learning Strategies"],
  instructing: ["Instructing", "Education and Training", "Speaking"],
  helping: ["Customer and Personal Service", "Service Orientation", "Social Perceptiveness"],
  care: ["Therapy and Counseling", "Customer and Personal Service", "Service Orientation"],
  caring: ["Therapy and Counseling", "Service Orientation", "Social Perceptiveness"],
  service: ["Customer and Personal Service", "Service Orientation"],
  social: ["Sociology and Anthropology", "Psychology", "Social Perceptiveness"],
  people: ["Psychology", "Social Perceptiveness", "Customer and Personal Service"],
  psychology: ["Psychology", "Therapy and Counseling", "Sociology and Anthropology"],
  healthcare: ["Medicine and Dentistry", "Therapy and Counseling", "Customer and Personal Service"],
  medicine: ["Medicine and Dentistry", "Biology", "Chemistry", "Therapy and Counseling"],
  medical: ["Medicine and Dentistry", "Biology", "Therapy and Counseling"],
  health: ["Medicine and Dentistry", "Therapy and Counseling", "Biology"],
  nursing: ["Medicine and Dentistry", "Therapy and Counseling", "Customer and Personal Service"],
  business: ["Administration and Management", "Economics and Accounting", "Judgment and Decision Making"],
  management: ["Administration and Management", "Management of Personnel Resources", "Coordination"],
  leadership: ["Administration and Management", "Management of Personnel Resources", "Judgment and Decision Making"],
  strategy: ["Administration and Management", "Economics and Accounting", "Systems Evaluation"],
  finance: ["Economics and Accounting", "Mathematics", "Management of Financial Resources"],
  financial: ["Economics and Accounting", "Mathematics", "Management of Financial Resources"],
  accounting: ["Economics and Accounting", "Mathematics", "Administrative"],
  economics: ["Economics and Accounting", "Mathematics", "Systems Analysis"],
  sales: ["Sales and Marketing", "Persuasion", "Customer and Personal Service"],
  marketing: ["Sales and Marketing", "Communications and Media", "Persuasion"],
  persuasion: ["Persuasion", "Negotiation", "Sales and Marketing"],
  negotiation: ["Negotiation", "Persuasion", "Social Perceptiveness"],
  law: ["Law and Government", "English Language", "Critical Thinking", "Persuasion"],
  legal: ["Law and Government", "English Language", "Critical Thinking"],
  argument: ["Persuasion", "Critical Thinking", "Law and Government"],
  policy: ["Law and Government", "Economics and Accounting", "Critical Thinking"],
  government: ["Law and Government", "Administration and Management"],
  design: ["Design", "Fine Arts", "Operations Analysis"],
  creative: ["Fine Arts", "Design", "Communications and Media"],
  art: ["Fine Arts", "Design"],
  media: ["Communications and Media", "Fine Arts", "English Language"],
  detail: ["Administrative", "Quality Control Analysis", "Monitoring"],
  organization: ["Administrative", "Time Management", "Coordination"],
  administrative: ["Administrative", "Administration and Management", "Time Management"],
  office: ["Administrative", "Computers and Electronics", "Time Management"],
  mechanical: ["Mechanical", "Repairing", "Equipment Maintenance", "Troubleshooting"],
  repair: ["Repairing", "Mechanical", "Troubleshooting"],
  trades: ["Mechanical", "Building and Construction", "Repairing"],
  construction: ["Building and Construction", "Mechanical", "Design"],
  maintenance: ["Equipment Maintenance", "Mechanical", "Repairing"],
  manufacturing: ["Production and Processing", "Mechanical", "Quality Control Analysis"],
  production: ["Production and Processing", "Operation and Control", "Quality Control Analysis"],
  operations: ["Operations Analysis", "Production and Processing", "Operations Monitoring"],
  transportation: ["Transportation", "Operation and Control", "Public Safety and Security"],
  logistics: ["Transportation", "Coordination", "Production and Processing"],
  driving: ["Transportation", "Operation and Control"],
  protective: ["Public Safety and Security", "Social Perceptiveness"],
  safety: ["Public Safety and Security", "Quality Control Analysis"],
  security: ["Public Safety and Security", "Computers and Electronics"],
  learning: ["Active Learning", "Learning Strategies"],
  "problem solving": ["Complex Problem Solving", "Critical Thinking", "Judgment and Decision Making"],
  "hands-on": ["Mechanical", "Operation and Control", "Equipment Maintenance"],
};

/** Cosine similarity of two equal-length vectors → [-1, 1] (0 if either is zero). */
export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Market statistics for distinctiveness weighting (from data.json meta). */
export interface SkillStats {
  skillMean: number[];
  skillStd: number[];
}

/** z-score a capability vector against the labor market (mean/std per dimension). */
export function zNormalize(vec: number[], stats: SkillStats): number[] {
  return vec.map((v, j) => {
    const s = stats.skillStd[j];
    return s > 0 ? (v - stats.skillMean[j]) / s : 0;
  });
}

/** Fit-squash steepness: how fast a distinctive z-advantage saturates. Tuned empirically. */
export const FIT_K = 0.28;

/**
 * FIT in O*NET capability-space, 0–1. Measures whether an occupation is
 * *distinctively* strong (relative to the whole labor market) in the capabilities
 * the user's interests imply.
 *
 *   t = L2-normalized interest target vector
 *   z = occupation capability, z-scored per dimension against the market
 *   raw = t · z         (avg market-relative strength on the target capabilities)
 *   fit = clamp01(0.5 + FIT_K · raw)
 */
export function fit(interestVec: number[], occVec: number[], stats: SkillStats): number {
  let norm = 0;
  for (const x of interestVec) norm += x * x;
  if (norm === 0) return 0.5; // no interest signal → neutral
  norm = Math.sqrt(norm);
  const z = zNormalize(occVec, stats);
  let raw = 0;
  for (let j = 0; j < interestVec.length; j++) raw += (interestVec[j] / norm) * z[j];
  return Math.max(0, Math.min(1, 0.5 + FIT_K * raw));
}

/** Distinctive-profile similarity between two occupations (for the redirect's nearest-neighbor). */
export function profileSimilarity(a: number[], b: number[], stats: SkillStats): number {
  return cosine(zNormalize(a, stats), zNormalize(b, stats));
}

/**
 * Build a 68-d interest target vector from the user's interests, in
 * CAPABILITY_ELEMENTS order. Returns null if none map to any capability, so the
 * scorer can fall back to a neutral fit instead of faking a match.
 */
export function buildInterestVector(interests: string[]): number[] | null {
  const vec = new Array(CAPABILITY_COUNT).fill(0);
  let hits = 0;
  const add = (skills: string[]) => {
    for (const sk of skills) {
      // Route the two "Mathematics" elements: a math-domain interest should hit
      // knowledge-Mathematics too, but the skills index is the default.
      vec[CAP_INDEX[sk]] += 1;
      if (sk === "Mathematics") vec[KNOW_MATH_INDEX] += 1;
    }
    hits++;
  };
  for (const raw of interests) {
    const s = raw.toLowerCase().trim();
    if (!s) continue;
    if (INTEREST_LEXICON[s]) { add(INTEREST_LEXICON[s]); continue; }
    for (const word of s.split(/[^a-z]+/)) if (INTEREST_LEXICON[word]) add(INTEREST_LEXICON[word]);
  }
  return hits === 0 ? null : vec;
}
