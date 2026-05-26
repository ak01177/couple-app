import { revokeBlobUrl } from "@/lib/revokeBlobUrl";

type CacheEntry = {
  url: string;
  revoke: () => void;
  cachedAt: number;
};

const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

export function getCachedMedia(path: string): { url: string } | null {
  const entry = cache.get(path);
  if (!entry) return null;

  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    entry.revoke();
    cache.delete(path);
    return null;
  }

  return { url: entry.url };
}

export function setCachedMedia(
  path: string,
  url: string,
  revoke?: () => void
): void {
  const existing = cache.get(path);
  if (existing) existing.revoke();

  cache.set(path, {
    url,
    revoke: revoke ?? (() => revokeBlobUrl(url)),
    cachedAt: Date.now(),
  });
}

export function invalidateCachedMedia(path: string): void {
  const entry = cache.get(path);
  if (!entry) return;
  entry.revoke();
  cache.delete(path);
}
