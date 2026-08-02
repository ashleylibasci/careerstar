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
  {
    code: "29-1151.00",
    title: "Nurse anesthetists",
    growthPct: 10,
    medianPay: 212000,
    aiExposure: 0.2,
    skills: ["medicine"],
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

test("a named career is pinned — the fuzzy sweep must not expand it into siblings", () => {
  // "registered nurse" names ONE occupation; the bare word "nurse" must not
  // also fire the alias table or drag in nurse-titled siblings from the sweep.
  const { candidateCodes } = parseInput("software developer and registered nurse", fixture);
  assert.deepEqual(
    [...candidateCodes].sort(),
    ["15-1252.00", "29-1141.00"],
    `expected exactly the two named careers, got ${JSON.stringify(candidateCodes)}`,
  );
});

test("the sweep still runs on text no alias claimed", () => {
  const { candidateCodes } = parseInput("registered nurse or maybe a welder", fixture);
  assert.ok(candidateCodes.includes("29-1141.00"), "named career kept");
  assert.ok(candidateCodes.includes("47-2111.00"), "unclaimed word still sweeps titles");
});
