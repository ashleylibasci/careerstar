import { test } from "node:test";
import assert from "node:assert/strict";
import { clientKey } from "./rate-limit.ts";

// The X-Forwarded-For contract: browsers never send XFF themselves, so for an
// honest client the viewer IP is the only hop (direct) or the second-to-last
// (CloudFront appends the viewer, then Amplify's router appends CloudFront's
// own varying edge IP last — keying on the LAST hop gave every request a fresh
// bucket in prod). Never the first hop: everything left of the platform-added
// entries is client-forgeable.
const mkReq = (xff?: string, realIp?: string) =>
  new Request("http://x/api/score", {
    headers: {
      ...(xff ? { "x-forwarded-for": xff } : {}),
      ...(realIp ? { "x-real-ip": realIp } : {}),
    },
  });

test("clientKey uses the second-to-last XFF hop when platform hops are present", () => {
  // honest prod shape: CloudFront appends viewer, router appends CF edge IP
  assert.equal(clientKey(mkReq("203.0.113.7, 64.252.0.9")), "203.0.113.7");
  // honest direct/local shape: the viewer is the only hop
  assert.equal(clientKey(mkReq("203.0.113.7")), "203.0.113.7");
  // attacker forges a prefix in the prod shape — the key must NOT move
  assert.equal(
    clientKey(mkReq("9.9.9.9, 203.0.113.7, 64.252.0.9")),
    clientKey(mkReq("2.2.2.2, 203.0.113.7, 64.252.0.9")),
  );
});

test("clientKey falls back to x-real-ip, then 'unknown'", () => {
  assert.equal(clientKey(mkReq(undefined, "198.51.100.5")), "198.51.100.5");
  assert.equal(clientKey(mkReq()), "unknown");
});
