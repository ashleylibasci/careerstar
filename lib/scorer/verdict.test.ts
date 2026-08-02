import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreBand, plainVerdict } from "./verdict.ts";
import type { Occupation, ScoreComponents } from "./types.ts";

test("scoreBand labels the Strong/Mixed boundary at 64/65", () => {
  assert.deepEqual(scoreBand(64), { label: "Mixed", tone: "mixed" });
  assert.deepEqual(scoreBand(65), { label: "Strong", tone: "strong" });
});

test("scoreBand labels the Mixed/Risky boundary at 44/45", () => {
  assert.deepEqual(scoreBand(44), { label: "Risky", tone: "risky" });
  assert.deepEqual(scoreBand(45), { label: "Mixed", tone: "mixed" });
});

test("plainVerdict returns a non-empty string mentioning growth", () => {
  const occ: Occupation = {
    code: "15-1252.00",
    title: "Software Developers",
    growthPct: 25,
    medianPay: 120000,
    aiExposure: 0.5,
    skills: ["programming"],
  };
  const components: ScoreComponents = { return: 80, risk: 50, fit: 70 };
  const verdict = plainVerdict(occ, components);
  assert.equal(typeof verdict, "string");
  assert.ok(verdict.length > 0, "expected a non-empty verdict");
  assert.match(verdict, /growth/);
});

test("plainVerdict never mentions interests when none were given", () => {
  const occ: Occupation = {
    code: "15-1252.00",
    title: "Software Developers",
    growthPct: 25,
    medianPay: 120000,
    aiExposure: 0.5,
    skills: ["programming"],
  };
  // Neutral fit=50 is what the scorer emits with no interest signal.
  const components: ScoreComponents = { return: 80, risk: 50, fit: 50 };
  const withInterests = plainVerdict(occ, components, true);
  const withoutInterests = plainVerdict(occ, components, false);
  assert.match(withInterests, /interests/);
  assert.doesNotMatch(withoutInterests, /interests/);
  assert.ok(withoutInterests.endsWith("."), "verdict should still end cleanly");
});

test("plainVerdict quotes the scenario-adjusted exposure when given", () => {
  const occ: Occupation = {
    code: "15-1252.00",
    title: "Software Developers",
    growthPct: 25,
    medianPay: 120000,
    aiExposure: 0.87,
    skills: ["programming"],
  };
  const components: ScoreComponents = { return: 80, risk: 90, fit: 50 };
  // Under an aggressive aiAdoption scenario the effective exposure clamps to 1.0;
  // the sentence must quote 100, matching the breakdown and the bears.
  assert.match(plainVerdict(occ, components, false, 1.0), /100\/100/);
  assert.match(plainVerdict(occ, components, false), /87\/100/);
});
