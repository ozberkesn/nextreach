// In-memory sliding-window limiter. Resets on cold start and is per-instance,
// so on serverless it's a soft deterrent rather than a hard guarantee --
// good enough for this project's scope, see README for what a real fix looks like.
const hits = new Map<string, number[]>();

export function isRateLimited(
  key: string,
  { max, windowMs }: { max: number; windowMs: number }
): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}
