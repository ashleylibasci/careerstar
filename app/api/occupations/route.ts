import data from "@/data/data.json";
import type { Occupation } from "@/lib/scorer/types";

const list = (data as { occupations: Occupation[] }).occupations
  .map((o) => ({ code: o.code, title: o.title, aliases: o.aliases ?? [] }))
  .sort((a, b) => a.title.localeCompare(b.title));

// GET /api/occupations — career list (with alternate titles) for the typeahead.
export function GET() {
  return Response.json({ occupations: list });
}
