import { test } from "node:test";
import assert from "node:assert/strict";
import { findRedirect } from "./redirect.ts";
import type { Occupation, ScoreResult } from "./types.ts";

function result(code: string, path: string, score: number): ScoreResult {
  return {
    code,
    path,
    score,
    components: { return: score, risk: 50, fit: score },
    note: "",
  };
}

const occLow: Occupation = {
  code: "A",
  title: "Alpha",
  growthPct: 2,
  medianPay: 45000,
  aiExposure: 0.8,
  skills: ["welding", "fabrication"],
};
const occHigh: Occupation = {
  code: "B",
  title: "Beta",
  growthPct: 20,
  medianPay: 90000,
  aiExposure: 0.2,
  skills: ["welding", "design"],
};
const occByCode = new Map<string, Occupation>([
  [occLow.code, occLow],
  [occHigh.code, occHigh],
]);

test("finds a higher-scoring, skill-adjacent redirect with a reason", () => {
  const low = result("A", "Alpha", 30);
  const allScored = [low, result("B", "Beta", 70)];

  const redirect = findRedirect(low, allScored, occByCode);
  assert.ok(redirect, "expected a redirect");
  assert.equal(redirect!.code, "B");
  assert.equal(redirect!.title, "Beta");
  assert.equal(redirect!.score, 70);
  assert.equal(typeof redirect!.reason, "string");
  assert.ok(redirect!.reason.length > 0, "expected a non-empty reason");
  // Shares the "welding" skill, so the reason should credit that strength.
  assert.match(redirect!.reason, /welding/);
});

test("returns undefined when nothing scores higher", () => {
  const low = result("A", "Alpha", 80);
  const allScored = [low, result("B", "Beta", 40)];

  const redirect = findRedirect(low, allScored, occByCode);
  assert.equal(redirect, undefined);
});
