import { test } from "node:test";
import assert from "node:assert/strict";
import { MODELS, modelScores, modelConsensus } from "./models.ts";
import type { ScoreResult } from "./types.ts";

const mkResult = (over: Partial<ScoreResult["breakdown"]> = {}, fit = 50, score = 60): ScoreResult => ({
  code: "X",
  path: "Test",
  score,
  components: { return: 60, risk: 40, fit },
  note: "",
  breakdown: {
    growthPct: 5,
    medianPay: 80000,
    aiExposurePct: 40,
    growthRank: 60,
    payRank: 60,
    resilience: 60,
    gamma: 0.6,
    alpha: 0.7,
    ...over,
  },
});

test("every model returns a bounded 0–100 score", () => {
  const scores = modelScores(mkResult(), 0.5);
  assert.equal(Object.keys(scores).length, MODELS.length);
  for (const v of Object.values(scores)) assert.ok(v >= 0 && v <= 100, `out of range: ${v}`);
});

test("models genuinely disagree: momentum ignores risk, defensive punishes it", () => {
  // High growth/pay but terrible resilience and no moat.
  const exposed = modelScores(mkResult({ growthRank: 95, payRank: 95, resilience: 10 }), 0.1);
  assert.ok(exposed.momentum > exposed.defensive + 20, `momentum ${exposed.momentum} should dwarf defensive ${exposed.defensive}`);
});

test("standard model mirrors the standard score exactly", () => {
  const r = mkResult({}, 50, 73);
  assert.equal(modelScores(r, 0.5).standard, 73);
});

test("consensus: mean and spread computed across models", () => {
  const { mean, spread } = modelConsensus({ a: 40, b: 60, c: 80 });
  assert.equal(mean, 60);
  assert.equal(spread, 40);
});

test("defensive model falls back to resilience when moat is unrated", () => {
  const withMoat = modelScores(mkResult(), 1.0).defensive;
  const noMoat = modelScores(mkResult(), null).defensive;
  assert.ok(withMoat > noMoat, "a perfect moat should beat the resilience fallback");
});
