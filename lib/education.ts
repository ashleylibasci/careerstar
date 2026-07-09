// Education levels (from BLS "Typical Entry-Level Education") + the years-of-
// schooling mapping used for the ROI signal (pay per year of education).

export const EDUCATION_YEARS: Record<string, number> = {
  "No formal educational credential": 0,
  "High school diploma or equivalent": 0,
  "Some college, no degree": 1,
  "Postsecondary nondegree award": 1,
  "Associate's degree": 2,
  "Bachelor's degree": 4,
  "Master's degree": 6,
  "Doctoral or professional degree": 8,
};

const SHORT: Record<string, string> = {
  "No formal educational credential": "No formal ed.",
  "High school diploma or equivalent": "High school",
  "Some college, no degree": "Some college",
  "Postsecondary nondegree award": "Postsec. award",
  "Associate's degree": "Associate's",
  "Bachelor's degree": "Bachelor's",
  "Master's degree": "Master's",
  "Doctoral or professional degree": "Doctoral/prof.",
};

/** Filter options, ordered from least to most schooling. */
export const EDUCATION_LEVELS = Object.keys(EDUCATION_YEARS);

export function educationYears(ed?: string): number {
  return EDUCATION_YEARS[ed ?? ""] ?? 0;
}

export function educationShort(ed?: string): string {
  if (!ed) return "—";
  return SHORT[ed] ?? ed;
}

/**
 * ROI signal: median pay per year of post-high-school schooling.
 * (years + 1 so a no-degree job isn't divided by zero and still ranks well.)
 */
export function roi(medianPay: number, ed?: string): number {
  return Math.round(medianPay / (educationYears(ed) + 1));
}
