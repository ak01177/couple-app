import type { SupabaseClient } from "@supabase/supabase-js";
import { getCachedMedia, setCachedMedia } from "@/lib/mediaCache";
import { withRetry } from "@/lib/retry";

export const COUPLE_MEDIA_BUCKET = "couple-media";

/**
 * DB stores storage object paths like `{coupleId}/chat/abc.jpg`.
 * Normalize legacy/full URLs and accidental bucket prefixes.
 */
export function normalizeStoragePath(
  pathOrUrl: string | null | undefined
): string | null {
  if (!pathOrUrl?.trim()) return null;

  const trimmed = pathOrUrl.trim();

  if (trimmed.startsWith("http")) {
    try {
      const url = new URL(trimmed);
      const match = url.pathname.match(
        /\/storage\/v1\/object\/(?:public|sign|authenticated)\/couple-media\/(.+)$/
      );
      if (match?.[1]) return decodeURIComponent(match[1]);
    } catch {
      return null;
    }
    return null;
  }

  let path = trimmed.replace(/^\/+/, "");
  if (path.startsWith(`${COUPLE_MEDIA_BUCKET}/`)) {
    path = path.slice(COUPLE_MEDIA_BUCKET.length + 1);
  }

  return path || null;
}

export type PrivateMediaResult =
  | { ok: true; url: string; revoke?: () => void }
  | { ok: false; reason: "invalid_path" | "not_found" | "forbidden" | "unknown" };

function isNotFoundError(error: { message?: string; statusCode?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.statusCode === "404" ||
    msg.includes("not found") ||
    msg.includes("object not found")
  );
}

function isAccessError(error: { message?: string; status?: number; statusCode?: string } | null) {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.statusCode === "403" ||
    error.status === 400 ||
    msg.includes("access") ||
    msg.includes("permission") ||
    msg.includes("policy") ||
    msg.includes("not allowed")
  );
}

/**
 * Load a private object using the authenticated session (blob URL).
 * Uses in-memory cache + retries for distant/slow connections.
 */
export async function getPrivateMediaUrl(
  supabase: SupabaseClient,
  pathOrUrl: string
): Promise<PrivateMediaResult> {
  const path = normalizeStoragePath(pathOrUrl);
  if (!path) return { ok: false, reason: "invalid_path" };

  const cached = getCachedMedia(path);
  if (cached) {
    return { ok: true, url: cached.url };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, reason: "forbidden" };
  }

  const downloadOnce = async () => {
    const { data: blob, error } = await supabase.storage
      .from(COUPLE_MEDIA_BUCKET)
      .download(path);

    if (error || !blob) {
      throw error ?? new Error("Download failed");
    }
    return blob;
  };

  try {
    const blob = await withRetry(downloadOnce, { retries: 2, baseDelayMs: 500 });
    const objectUrl = URL.createObjectURL(blob);
    const revoke = () => URL.revokeObjectURL(objectUrl);
    setCachedMedia(path, objectUrl, revoke);
    return { ok: true, url: objectUrl, revoke };
  } catch (downloadError) {
    const err = downloadError as { message?: string; statusCode?: string; status?: number };
    if (isNotFoundError(err)) return { ok: false, reason: "not_found" };
    if (isAccessError(err)) return { ok: false, reason: "forbidden" };
    return { ok: false, reason: "unknown" };
  }
}

/**
 * Get a public URL for an object (if the bucket is public).
 * For avatars, we can often rely on public URLs or signed URLs.
 */
export function getPublicUrl(pathOrUrl: string): string {
  const path = normalizeStoragePath(pathOrUrl);
  if (!path) return "";
  
  // Hardcode the Supabase URL or construct it
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  return `${supabaseUrl}/storage/v1/object/public/${COUPLE_MEDIA_BUCKET}/${path}`;
}
