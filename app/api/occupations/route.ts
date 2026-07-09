import data from "@/data/data.json";
import type { Occupation } from "@/lib/scorer/types";

const list = (data as { occupations: Occupation[] }).occupations
  .map((o) => ({ code: o.code, title: o.title }))
  .sort((a, b) => a.title.localeCompare(b.title));

// GET /api/occupations — the career list, for the autocomplete typeahead.
export function GET() {
  return Response.json({ occupations: list });
}
