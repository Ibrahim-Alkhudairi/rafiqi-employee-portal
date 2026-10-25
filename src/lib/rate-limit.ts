import "server-only";
import { headers } from "next/headers";

// A per-IP fixed window kept in memory: enough to slow down scripted sign-ups
// and password guessing on a single instance. Azure App Service appends the
// real client address to X-Forwarded-For, so the last entry is the one a
// client can't forge.

const g = globalThis as typeof globalThis & { __rafiqiHits?: Map<string, { count: number; resetAt: number }> };
const hits = (g.__rafiqiHits ??= new Map());

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",").at(-1)?.trim() || h.get("x-real-ip") || "unknown";
}

/** Returns false once `ip` has used up `limit` attempts in the current window. */
export function allow(bucket: string, ip: string, limit: number, windowMs: number): boolean {
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    if (hits.size > 10_000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    return true;
  }
  entry.count++;
  return entry.count <= limit;
}
