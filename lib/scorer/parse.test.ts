import { test } from "node:test";
import assert from "node:assert/strict";
import { parseInput } from "./parse.ts";
import type { Occupation } from "./types.ts";

// A small fixture set. Note: alias matching maps to real O*NET codes that need
// not appear in the dataset, while title-prefix and interest matching operate
// over these rows.
const fixture: Occupation[] = [
  {
    code: "15-1252.00",
    title: "Software Developers",
    growthPct: 25,
    medianPay: 120000,
    aiExposure: 0.5,
    skills: ["programming", "math"],
    aliases: ["software engineer"],
  },
  {
    code: "47-2111.00",
    title: "Welders, cutters, and brazers",
    growthPct: 2,
    medianPay: 47000,
    aiExposure: 0.3,
    skills: ["fabrication", "metalwork"],
  },
];

test("a known alias resolves to its O*NET code", () => {
  const { candidateCodes } = parseInput("I want to be a software engineer", fixture);
  assert.ok(
    candidateCodes.includes("15-1252.00"),
    `expected 15-1252.00 in ${JSON.stringify(candidateCodes)}`,
  );
});

test("a healthcare phrase yields the registered-nurse code even without a dataset row", () => {
  const { candidateCodes } = parseInput("thinking about becoming a nurse", fixture);
  assert.ok(
    candidateCodes.includes("29-1141.00"),
    `expected 29-1141.00 in ${JSON.stringify(candidateCodes)}`,
  );
});

test("interest tags are extracted from the dataset's skills", () => {
  const { interests } = parseInput("I love metal fabrication work", fixture);
  assert.ok(
    interests.includes("fabrication"),
    `expected 'fabrication' in ${JSON.stringify(interests)}`,
  );
});

test("title-prefix matching finds an occupation by its title word", () => {
  const { candidateCodes } = parseInput("experienced welder", fixture);
  assert.ok(
    candidateCodes.includes("47-2111.00"),
    `expected 47-2111.00 in ${JSON.stringify(candidateCodes)}`,
  );
});
