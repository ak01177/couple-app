"use client";

import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Signal } from "lucide-react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export function ConnectionBanner() {
  const { isOnline, isSlow } = useNetworkStatus();
  const show = !isOnline || isSlow;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="absolute top-0 inset-x-0 z-[60] px-4 safe-top pt-2 pointer-events-none"
        >
          <div
            className={`mx-auto max-w-lg flex items-center justify-center gap-2 px-3 py-2 rounded-full text-xs font-medium shadow-lg backdrop-blur-md border ${
              !isOnline
                ? "bg-error/20 border-error/30 text-error"
                : "bg-warning/15 border-warning/25 text-warning"
            }`}
          >
            {!isOnline ? (
              <>
                <WifiOff size={14} />
                <span>You&apos;re offline — we&apos;ll sync when you&apos;re back</span>
              </>
            ) : (
              <>
                <Signal size={14} />
                <span>Slow connection — things may take a moment</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
