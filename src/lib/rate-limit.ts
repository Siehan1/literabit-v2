export type RateLimitConfig = {
  maxRequests: number;
  windowMs: number;
  maxEntries?: number;
};

export type RateLimitDecision =
  | { allowed: true; remaining: number; resetAt: number }
  | { allowed: false; remaining: 0; resetAt: number; retryAfterSeconds: number };

export type RateLimiter = {
  consume: (key: string, nowMs?: number) => RateLimitDecision;
  reset: () => void;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const DEFAULT_MAX_ENTRIES = 10_000;
const activeLimiters = new Set<RateLimiter>();

export function getClientIp(request: Request): string {
  // Behind a trusted reverse proxy in production, x-forwarded-for lists the client IP first.
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor !== null) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp !== undefined && firstIp.length > 0) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp !== undefined && realIp.length > 0) {
    return realIp;
  }

  return "unknown";
}

export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  const maxEntries = config.maxEntries ?? DEFAULT_MAX_ENTRIES;
  const buckets = new Map<string, RateLimitBucket>();

  function evictExpired(nowMs: number): void {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= nowMs) {
        buckets.delete(key);
      }
    }
  }

  const limiter: RateLimiter = {
    consume(key: string, nowMs: number = Date.now()): RateLimitDecision {
      const existing = buckets.get(key);

      if (existing === undefined || existing.resetAt <= nowMs) {
        if (buckets.size >= maxEntries) {
          evictExpired(nowMs);
          if (buckets.size >= maxEntries) {
            const oldestKey = buckets.keys().next().value;
            if (oldestKey !== undefined) {
              buckets.delete(oldestKey);
            }
          }
        }

        const resetAt = nowMs + config.windowMs;
        buckets.set(key, { count: 1, resetAt });
        return {
          allowed: true,
          remaining: Math.max(0, config.maxRequests - 1),
          resetAt,
        };
      }

      if (existing.count >= config.maxRequests) {
        const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - nowMs) / 1000));
        return {
          allowed: false,
          remaining: 0,
          resetAt: existing.resetAt,
          retryAfterSeconds,
        };
      }

      existing.count += 1;
      return {
        allowed: true,
        remaining: Math.max(0, config.maxRequests - existing.count),
        resetAt: existing.resetAt,
      };
    },
    reset(): void {
      buckets.clear();
    },
  };

  activeLimiters.add(limiter);
  return limiter;
}

export function resetAllRateLimitersForTests(): void {
  for (const limiter of activeLimiters) {
    limiter.reset();
  }
}
