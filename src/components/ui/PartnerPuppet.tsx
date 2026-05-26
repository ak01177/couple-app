"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { usePresenceStore, useAuthStore } from "@/store";
import { useEffect, useRef } from "react";

// Waving hand plays exactly once when the puppet first appears — not tied to isTyping.
function WavingHand() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10, y: 10, rotate: 0 }}
      animate={{
        opacity: [0, 1, 1, 1, 0],
        x: -14,
        y: 4,
        rotate: [0, 25, -10, 25, 0],
      }}
      transition={{
        duration: 1.8,
        delay: 0.2,
        ease: "easeInOut",
        times: [0, 0.1, 0.5, 0.8, 1],
      }}
      className="absolute -left-1 text-xl pointer-events-none select-none"
      style={{ zIndex: 5 }}
    >
      👋
    </motion.div>
  );
}

export function PartnerPuppet() {
  const { partnerPresence } = usePresenceStore();
  const { partner } = useAuthStore();

  // useAnimation lets us smoothly transition between idle ↔ typing animations
  // WITHOUT replacing the entire `animate` prop (which causes the glitch).
  const bodyControls = useAnimation();

  // Track previous typing state to avoid redundant starts
  const prevTyping = useRef<boolean | null>(null);

  const isPartnerInChat = partnerPresence?.current_path === "/chat";
  const isTyping = !!partnerPresence?.is_typing;

  // Start idle bob immediately on mount
  useEffect(() => {
    bodyControls.start({
      y: [0, -3, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Smoothly switch animation on typing state change — no prop-swap glitch
  useEffect(() => {
    if (prevTyping.current === isTyping) return;
    prevTyping.current = isTyping;

    if (isTyping) {
      // Excited bounce while typing
      bodyControls.start({
        y: [0, -6, 0],
        transition: {
          duration: 0.9,
          repeat: Infinity,
          ease: "easeInOut",
        },
      });
    } else {
      // Back to gentle idle
      bodyControls.start({
        y: [0, -3, 0],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        },
      });
    }
  }, [isTyping, bodyControls]);

  if (!partner) return null;

  const partnerName = partner.display_name?.toLowerCase() || "";
  const isAryan = partnerName.includes("aryan");
  const isShraddha = partnerName.includes("shraddha");

  const AvatarEmoji = isAryan ? "👦🏻" : isShraddha ? "👧🏻" : "🐻";
  const bgGlow = isAryan
    ? "bg-blue-500/20 shadow-blue-500/30"
    : isShraddha
    ? "bg-pink/20 shadow-pink/30"
    : "bg-accent/20 shadow-accent/30";
  const borderColor = isAryan
    ? "border-blue-500/40"
    : isShraddha
    ? "border-pink/40"
    : "border-accent/40";
  const dotColor = isAryan ? "bg-blue-400" : isShraddha ? "bg-pink" : "bg-accent";

  return (
    <div className="absolute bottom-[100px] left-4 z-40 pointer-events-none">
      <AnimatePresence>
        {isPartnerInChat && (
          <motion.div
            key="puppet"
            // Very snappy spring — appears almost instantly once data arrives
            initial={{ y: 60, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.5 }}
            transition={{
              type: "spring",
              stiffness: 520,
              damping: 26,
              mass: 0.55,
            }}
            className="relative flex flex-col items-center"
          >
            {/* ── Typing cloud ── */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  key="cloud"
                  initial={{ opacity: 0, scale: 0.6, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6, y: 8 }}
                  transition={{
                    type: "spring",
                    stiffness: 600,
                    damping: 28,
                    mass: 0.5,
                  }}
                  className="absolute -top-12 -right-4 bg-bg-elevated border border-border/60 rounded-2xl px-3 py-1.5 shadow-soft flex items-center justify-center"
                  style={{ zIndex: 10 }}
                >
                  {/* Cloud tail */}
                  <div className="absolute -bottom-1.5 left-2 w-2 h-2 bg-bg-elevated border-r border-b border-border/60 rotate-45" />

                  {/* Dots */}
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: "easeInOut",
                        }}
                        className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Avatar body ── */}
            <motion.div
              animate={bodyControls}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl border-2 backdrop-blur-md shadow-lg relative ${bgGlow} ${borderColor}`}
            >
              {AvatarEmoji}
              {/* Wave hand — mounted once, plays its animation and fades. No re-trigger. */}
              <WavingHand key="wave" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
