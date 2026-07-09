import { test } from "node:test";
import assert from "node:assert/strict";
import { computeScores } from "./scorer.ts";
import type { Occupation } from "./types.ts";

const fixture: Occupation[] = [
  { code: "A", title: "Alpha", growthPct: 30, medianPay: 120000, aiExposure: 0.2, skills: ["math", "data"] },
  { code: "B", title: "Beta", growthPct: -10, medianPay: 90000, aiExposure: 0.95, skills: ["programming"] },
  { code: "C", title: "Gamma", growthPct: 10, medianPay: 100000, aiExposure: 0.5, skills: ["finance"] },
];

test("scores are deterministic", () => {
  const a = computeScores(fixture, ["math"], ["A"]);
  const b = computeScores(fixture, ["math"], ["A"]);
  assert.deepEqual(a, b);
});

test("pinned score for a known input (Alpha, interest=math)", () => {
  // Hand-computed: growthRank=1, payRank=1 → Return=1.0; exposure=0.2,
  // volatility=0 → Risk=0.14; RAV=1·(1−0.6·0.14)=0.916; fit=1 →
  // Score=100·(0.7·0.916 + 0.3·1)=94.12 → 94.
  const [alpha] = computeScores(fixture, ["math"], ["A"]);
  assert.equal(alpha.path, "Alpha");
  assert.equal(alpha.score, 94);
  assert.deepEqual(alpha.components, { return: 100, risk: 14, fit: 100 });
});

test("a declining, high-exposure, no-fit field scores low", () => {
  const [beta] = computeScores(fixture, ["math"], ["B"]);
  assert.ok(beta.score < 25, `expected < 25, got ${beta.score}`);
});

test("unknown candidate codes are skipped, not errored", () => {
  const results = computeScores(fixture, ["math"], ["A", "ZZ", "C"]);
  assert.equal(results.length, 2);
});
