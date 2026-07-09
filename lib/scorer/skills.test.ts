import { test } from "node:test";
import assert from "node:assert/strict";
import {
  cosine,
  buildInterestVector,
  fit,
  profileSimilarity,
  CAPABILITY_ELEMENTS,
  CAPABILITY_COUNT,
} from "./skills.ts";

test("capability space is 68-d (35 skills + 33 knowledge)", () => {
  assert.equal(CAPABILITY_COUNT, 68);
  assert.equal(CAPABILITY_ELEMENTS.length, 68);
});

test("cosine: identical → 1, orthogonal → 0, zero → 0", () => {
  assert.equal(cosine([1, 0], [1, 0]), 1);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.equal(cosine([0, 0], [1, 1]), 0);
});

test("buildInterestVector: unknown interest → null; known → nonzero on mapped dims", () => {
  assert.equal(buildInterestVector(["qwertyuiop"]), null);
  const v = buildInterestVector(["math"]);
  assert.ok(v);
  const mathIdx = CAPABILITY_ELEMENTS.indexOf("Mathematics");
  assert.ok(v[mathIdx] > 0, "Mathematics dimension should be set by interest 'math'");
});

test("fit: no interest signal → neutral 0.5", () => {
  const occ = new Array(CAPABILITY_COUNT).fill(3);
  const stats = { skillMean: new Array(CAPABILITY_COUNT).fill(3), skillStd: new Array(CAPABILITY_COUNT).fill(1) };
  assert.equal(fit([], occ, stats), 0.5);
  assert.equal(fit(new Array(CAPABILITY_COUNT).fill(0), occ, stats), 0.5);
});

test("fit: distinctively strong on the target skill beats distinctively weak", () => {
  // Two-relevant-dims sanity check using the real 68-d space.
  const stats = {
    skillMean: new Array(CAPABILITY_COUNT).fill(3),
    skillStd: new Array(CAPABILITY_COUNT).fill(1),
  };
  const mathIdx = CAPABILITY_ELEMENTS.indexOf("Mathematics");
  const target = buildInterestVector(["math"])!;

  const strong = new Array(CAPABILITY_COUNT).fill(3);
  strong[mathIdx] = 5; // +2 SD above market on Mathematics
  const weak = new Array(CAPABILITY_COUNT).fill(3);
  weak[mathIdx] = 1; // −2 SD below

  const fStrong = fit(target, strong, stats);
  const fWeak = fit(target, weak, stats);
  assert.ok(fStrong > fWeak, `strong ${fStrong} should exceed weak ${fWeak}`);
  assert.ok(fStrong > 0.5 && fWeak < 0.5);
});

test("fit is deterministic", () => {
  const stats = { skillMean: new Array(CAPABILITY_COUNT).fill(3), skillStd: new Array(CAPABILITY_COUNT).fill(1) };
  const occ = new Array(CAPABILITY_COUNT).fill(4);
  const t = buildInterestVector(["finance", "business"])!;
  assert.equal(fit(t, occ, stats), fit(t, occ, stats));
});

test("profileSimilarity: an occupation is most similar to itself", () => {
  const stats = { skillMean: new Array(CAPABILITY_COUNT).fill(3), skillStd: new Array(CAPABILITY_COUNT).fill(1) };
  const a = new Array(CAPABILITY_COUNT).fill(3);
  a[0] = 5; a[10] = 4;
  const b = new Array(CAPABILITY_COUNT).fill(3);
  b[20] = 5; b[30] = 4;
  assert.ok(profileSimilarity(a, a, stats) > profileSimilarity(a, b, stats));
});
