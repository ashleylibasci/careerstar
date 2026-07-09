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

interface Entry {
  count: number;
  resetAt: number;
}

const hits = new Map<string, Entry>();

export interface RateResult {
  allowed: boolean;
  /** Seconds until the window resets (when blocked). */
  retryAfter: number;
}

export function rateLimit(key: string): RateResult {
  const now = Date.now();

  // Opportunistic cleanup so the map can't grow without bound.
  if (hits.size > MAX_KEYS) {
    for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
  }

  const entry = hits.get(key);
  if (!entry || now >= entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }
  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

/** Best-effort client identifier from proxy headers. */
export function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
