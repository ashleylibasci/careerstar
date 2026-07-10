import { test } from "node:test";
import assert from "node:assert/strict";
import { moatScore, moatRating, distinctiveness, MOAT_WIDE, MOAT_NARROW } from "./moat.ts";
import { CAPABILITY_COUNT } from "./skills.ts";

const flatStats = {
  skillMean: new Array(CAPABILITY_COUNT).fill(3),
  skillStd: new Array(CAPABILITY_COUNT).fill(1),
};

test("moat: sheltered + distinctive → wide; exposed + generic → none", () => {
  const distinctiveVec = new Array(CAPABILITY_COUNT).fill(3);
  for (let i = 0; i < 5; i++) distinctiveVec[i] = 6; // top-5 at +3σ
  const genericVec = new Array(CAPABILITY_COUNT).fill(3); // exactly market-average

  const wide = moatRating(moatScore(0.1, distinctiveVec, flatStats));
  const none = moatRating(moatScore(0.9, genericVec, flatStats));
  assert.equal(wide, "wide");
  assert.equal(none, "none");
});

test("moat: missing vector → null (not rated), never a fake rating", () => {
  assert.equal(moatScore(0.5, null, flatStats), null);
  assert.equal(moatRating(null), null);
});

test("moat thresholds are ordered and boundaries classify correctly", () => {
  assert.ok(MOAT_WIDE > MOAT_NARROW);
  assert.equal(moatRating(MOAT_WIDE), "wide");
  assert.equal(moatRating(MOAT_NARROW), "narrow");
  assert.equal(moatRating(MOAT_NARROW - 0.001), "none");
});

test("distinctiveness: mean of the top-5 z-scores", () => {
  const vec = new Array(CAPABILITY_COUNT).fill(3);
  vec[0] = 5; vec[1] = 5; vec[2] = 5; vec[3] = 5; vec[4] = 5; // +2σ each
  assert.equal(distinctiveness(vec, flatStats), 2);
});
