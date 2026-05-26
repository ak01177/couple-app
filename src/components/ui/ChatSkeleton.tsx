"use client";

import Skeleton from "./Skeleton";

export function ChatSkeleton() {
  return (
    <div className="space-y-4 px-4 py-3" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`flex gap-2 ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          {i % 2 === 0 && <Skeleton variant="circular" className="w-8 h-8 shrink-0" />}
          <Skeleton
            variant="rectangular"
            className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-[55%]" : "w-[45%]"}`}
          />
        </div>
      ))}
    </div>
  );
}
