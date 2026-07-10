import type { MetadataRoute } from "next";
import data from "@/data/data.json";
import { FIELDS } from "@/lib/fields";
import type { Occupation } from "@/lib/scorer/types";

const BASE = "https://main.d3ag7o87gtn2c8.amplifyapp.com";
const OCCUPATIONS = (data as { occupations: Occupation[] }).occupations;

export default function sitemap(): MetadataRoute.Sitemap {
  const statics = ["", "/explore", "/methodology", "/architecture", "/case-study"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "monthly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const fields = FIELDS.map((f) => ({
    url: `${BASE}/field/${f.group}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  const careers = OCCUPATIONS.map((o) => ({
    url: `${BASE}/career/${o.code}`,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));
  return [...statics, ...fields, ...careers];
}
