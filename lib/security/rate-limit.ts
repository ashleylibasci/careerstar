// Fixed-window rate limiter (Story 4.3) — abuse & cost control.
//
// In-memory per instance. On serverless (AWS Amplify/Lambda) each instance has
// its own window, so this bounds abuse per instance rather than globally — an
// intentional MVP trade-off (a shared store like Redis/DynamoDB would make it
// global). It still stops a single client hammering one instance from running
// up the Anthropic bill.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const MAX_KEYS = 10_000; // guard against unbounded memory growth
const GLOBAL_MAX = 600; // hard ceiling on total requests/window across ALL clients — a spoof/DDoS backstop

interface Entry {
  count: number;
  resetAt: number;
}

const hits = new Map<string, Entry>();
let globalCount = 0;
let globalResetAt = 0;

export interface RateResult {
  allowed: boolean;
  /** Seconds until the window resets (when blocked). */
  retryAfter: number;
}

export function rateLimit(key: string): RateResult {
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow without bound. Under a flood of
  // unique keys we can't evict live entries, so a GLOBAL ceiling (below) is the
  // real backstop; this just reclaims expired ones.
  if (hits.size > MAX_KEYS) {
    for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
  }

  // Global cap across all clients — bounds paid LLM calls even if per-client keys
  // are spoofed/distributed. Fails safe: when the ceiling is hit, everyone waits.
  if (now >= globalResetAt) { globalCount = 0; globalResetAt = now + WINDOW_MS; }
  if (globalCount >= GLOBAL_MAX) {
    return { allowed: false, retryAfter: Math.ceil((globalResetAt - now) / 1000) };
  }

  const entry = hits.get(key);
  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    globalCount++;
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  globalCount++;
  return { allowed: true, retryAfter: 0 };
}

/** Best-effort client identifier from proxy headers.
 *  A client can forge everything to the LEFT of the hops the platform appends,
 *  so the first entry is never trusted. But the very last hop isn't always the
 *  viewer either: on Amplify the internal router can append CloudFront's own
 *  (varying) edge IP after the viewer IP CloudFront appended — keying on it
 *  gives every request a fresh bucket and the per-client cap never fires
 *  (observed live 2026-07-23: 30 rapid POSTs, zero 429s). Browsers don't send
 *  X-Forwarded-For themselves, so for honest clients the viewer IP is the only
 *  hop (direct/local) or the second-to-last (behind CloudFront + router) —
 *  key on that. A spoofer rotating the forged prefix only rotates buckets
 *  until GLOBAL_MAX bites, which is the designed backstop. */
export function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) {
    const hops = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    if (hops.length >= 2) return hops[hops.length - 2];
    if (hops.length === 1) return hops[0];
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
