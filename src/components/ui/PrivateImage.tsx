import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPrivateMediaUrl } from "@/lib/storage";
import { revokeBlobUrl } from "@/lib/revokeBlobUrl";
import { useAuthStore } from "@/store";
import { ArrowDown, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

export function PrivateImage({
  path,
  alt = "Shared private photo",
  className = "w-full h-auto object-cover max-h-[300px] cursor-pointer",
  autoLoad = false,
}: {
  path: string;
  alt?: string;
  className?: string;
  autoLoad?: boolean;
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewed, setIsViewed] = useState(autoLoad);
  const [error, setError] = useState(false);
  const revokeRef = useRef<(() => void) | null>(null);
  const { user, coupleId, isLoading: authLoading } = useAuthStore();

  const fetchImage = async () => {
    if (!path) return;
    setIsLoading(true);
    setIsViewed(true);
    setError(false);

    const supabase = createClient();
    const result = await getPrivateMediaUrl(supabase, path);

    if (result.ok) {
      revokeRef.current?.();
      setImgUrl(result.url);
      revokeRef.current = result.revoke ?? (() => revokeBlobUrl(result.url));
    } else {
      setError(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!autoLoad || authLoading || !user || !coupleId) return;
    if (!imgUrl && !isLoading && !error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- load private media when auth is ready
      void fetchImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, path, authLoading, user, coupleId]);

  useEffect(() => {
    return () => {
      revokeRef.current?.();
    };
  }, []);

  if (!isViewed) {
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={fetchImage}
        className={`w-48 h-48 mb-2 rounded-xl bg-gradient-to-br from-bg-elevated to-bg-surface border border-border/60 flex flex-col items-center justify-center gap-3 text-text-secondary hover:text-text-primary transition-colors cursor-pointer shadow-soft group ${className?.includes("w-full") ? "!w-full" : ""}`}
      >
        <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
          <ImageIcon size={24} />
        </div>
        <span className="text-sm font-medium tracking-wide">Tap to view</span>
      </motion.button>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`w-48 h-48 mb-2 rounded-xl bg-bg-elevated animate-pulse flex items-center justify-center text-text-muted text-xs border border-border/40 ${className?.includes("w-full") ? "!w-full" : ""}`}
      >
        Loading...
      </div>
    );
  }

  if (error || !imgUrl) {
    return (
      <div
        className={`w-48 h-48 mb-2 rounded-xl bg-bg-elevated border border-border/40 flex flex-col items-center justify-center gap-2 text-text-muted text-xs text-center p-4 ${className?.includes("w-full") ? "!w-full" : ""}`}
      >
        <span>Photo unavailable</span>
        <button
          type="button"
          onClick={() => {
            setError(false);
            setIsViewed(true);
            void fetchImage();
          }}
          className="text-accent hover:text-accent-light font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mb-2 rounded-xl overflow-hidden border border-border/40 group relative ${className?.includes("w-full") ? "w-full" : ""}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgUrl}
        alt={alt}
        className={className}
        onClick={() => window.open(imgUrl, "_blank")}
      />
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={imgUrl}
          download
          target="_blank"
          rel="noreferrer"
          className="p-1.5 bg-black/50 text-white rounded-lg backdrop-blur-md hover:bg-black/70 transition-colors inline-block shadow-lg"
          title="Download"
        >
          <ArrowDown size={14} />
        </a>
      </div>
    </motion.div>
  );
}
