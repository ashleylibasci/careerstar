import { test } from "node:test";
import assert from "node:assert/strict";
import { clientKey } from "./rate-limit.ts";

// The X-Forwarded-For fix: a client can forge everything to the LEFT of the
// real IP that the trusted proxy (CloudFront/Amplify) appends, so we must key
// on the LAST hop — never the first (the old, spoofable behavior).
const mkReq = (xff?: string, realIp?: string) =>
  new Request("http://x/api/score", {
    headers: {
      ...(xff ? { "x-forwarded-for": xff } : {}),
      ...(realIp ? { "x-real-ip": realIp } : {}),
    },
  });

test("clientKey uses the last XFF hop, not the spoofable first", () => {
  // attacker forges "1.1.1.1"; CloudFront appends the true client "203.0.113.7"
  assert.equal(clientKey(mkReq("1.1.1.1, 203.0.113.7")), "203.0.113.7");
  // rotating the forged left-hand entry must NOT change the key
  assert.equal(
    clientKey(mkReq("9.9.9.9, 203.0.113.7")),
    clientKey(mkReq("2.2.2.2, 203.0.113.7")),
  );
});

test("clientKey falls back to x-real-ip, then 'unknown'", () => {
  assert.equal(clientKey(mkReq(undefined, "198.51.100.5")), "198.51.100.5");
  assert.equal(clientKey(mkReq()), "unknown");
});
