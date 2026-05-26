"use client";

import type { OnlineStatus } from "@/types";
import { getPublicUrl } from "@/lib/storage";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: OnlineStatus;
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const statusSizeClasses = {
  sm: "w-2.5 h-2.5 border-[1.5px]",
  md: "w-3 h-3 border-2",
  lg: "w-3.5 h-3.5 border-2",
  xl: "w-4 h-4 border-2",
};

const statusColors: Record<OnlineStatus, string> = {
  online: "bg-success",
  offline: "bg-text-muted",
  away: "bg-warning",
};

export default function Avatar({
  src,
  alt,
  size = "md",
  status,
  className = "",
}: AvatarProps) {
  const initials = alt
    ? alt.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const resolvedSrc = src && !src.startsWith("http") ? getPublicUrl(src) : src;

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt}
          className={`
            ${sizeClasses[size]} rounded-full object-cover
            ring-2 ring-border/50
          `}
        />
      ) : (
        <div
          className={`
            ${sizeClasses[size]} rounded-full
            bg-gradient-to-br from-accent to-pink
            flex items-center justify-center font-semibold text-white
            ring-2 ring-border/50
          `}
        >
          {initials}
        </div>
      )}
      {status && (
        <span
          className={`
            absolute bottom-0 right-0
            ${statusSizeClasses[size]}
            ${statusColors[status]}
            rounded-full border-bg-deep
          `}
        />
      )}
    </div>
  );
}
