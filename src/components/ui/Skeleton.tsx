"use client";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
}: SkeletonProps) {
  const baseClasses = "bg-bg-elevated animate-shimmer";
  const bgGradient =
    "bg-[length:200%_100%] bg-gradient-to-r from-bg-elevated via-bg-hover to-bg-elevated";

  const variantClasses = {
    text: "rounded-md h-4 w-full",
    circular: "rounded-full",
    rectangular: "rounded-card",
  };

  return (
    <div
      className={`${baseClasses} ${bgGradient} ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
