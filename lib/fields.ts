// Career fields = SOC major groups (first 2 digits of the O*NET-SOC code).
// Used both to offer "field" chips in the UI and to expand a field to its
// occupations when scoring.

export interface Field {
  group: string;
  name: string;
}

export const FIELDS: Field[] = [
  { group: "11", name: "Management" },
  { group: "13", name: "Business & finance" },
  { group: "15", name: "Computer & math" },
  { group: "17", name: "Architecture & engineering" },
  { group: "19", name: "Science" },
  { group: "21", name: "Community & social service" },
  { group: "23", name: "Legal" },
  { group: "25", name: "Education" },
  { group: "27", name: "Arts, design & media" },
  { group: "29", name: "Healthcare" },
  { group: "31", name: "Healthcare support" },
  { group: "33", name: "Protective service" },
  { group: "35", name: "Food & hospitality" },
  { group: "37", name: "Building & grounds" },
  { group: "39", name: "Personal care" },
  { group: "41", name: "Sales" },
  { group: "43", name: "Office & admin" },
  { group: "45", name: "Farming & outdoors" },
  { group: "47", name: "Construction" },
  { group: "49", name: "Installation & repair" },
  { group: "51", name: "Production" },
  { group: "53", name: "Transportation" },
];

const NAME_BY_GROUP = new Map(FIELDS.map((f) => [f.group, f.name]));

export function fieldName(group: string): string {
  return NAME_BY_GROUP.get(group) ?? "Other";
}

/** The SOC major group of an O*NET-SOC code, e.g. "15-1252.00" → "15". */
export function groupOf(code: string): string {
  return code.slice(0, 2);
}
