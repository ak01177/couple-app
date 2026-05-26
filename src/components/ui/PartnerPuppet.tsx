"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePresenceStore, useAuthStore } from "@/store";

export function PartnerPuppet() {
  const { partnerPresence } = usePresenceStore();
  const { partner } = useAuthStore();

  const isPartnerInChat = partnerPresence?.current_path === "/chat";
  const isTyping = partnerPresence?.is_typing;
  
  if (!partner) return null;
  
  const partnerName = partner.display_name?.toLowerCase() || "";
  const isAryan = partnerName.includes("aryan");
  const isShraddha = partnerName.includes("shraddha");
  
  // Default to a cute bear if names don't match exactly
  const AvatarEmoji = isAryan ? "👦🏻" : isShraddha ? "👧🏻" : "🐻";
  const bgGlow = isAryan ? "bg-blue-500/20 shadow-blue-500/30" : isShraddha ? "bg-pink/20 shadow-pink/30" : "bg-accent/20 shadow-accent/30";
  const borderColor = isAryan ? "border-blue-500/40" : isShraddha ? "border-pink/40" : "border-accent/40";

  return (
    <div className="absolute bottom-[100px] left-4 z-40 pointer-events-none">
      <AnimatePresence>
        {isPartnerInChat && (
          <motion.div
            initial={{ y: 80, opacity: 0, rotate: -15, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
            exit={{ y: 80, opacity: 0, rotate: 15, scale: 0.5 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              mass: 0.8,
            }}
            className="relative flex flex-col items-center"
          >
            {/* Thinking Cloud (Typing Indicator) */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.5 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.5, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute -top-12 -right-4 bg-bg-elevated border border-border/60 rounded-2xl px-3 py-1.5 shadow-soft flex items-center justify-center"
                >
                  {/* Cloud Tail */}
                  <div className="absolute -bottom-1.5 left-2 w-2 h-2 bg-bg-elevated border-r border-b border-border/60 rotate-45" />
                  
                  <motion.div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -3, 0] }}
                        transition={{
                          duration: 0.6,
                          repeat: Infinity,
                          delay: i * 0.15,
                          ease: "easeInOut",
                        }}
                        className={`w-1.5 h-1.5 rounded-full ${isAryan ? "bg-blue-400" : isShraddha ? "bg-pink" : "bg-accent"}`}
                      />
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Avatar Body */}
            <motion.div
              animate={isTyping ? { 
                y: [0, -4, 0],
                rotate: [-2, 2, -2]
              } : {
                y: [0, -2, 0]
              }}
              transition={isTyping ? {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              } : {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl border-2 backdrop-blur-md shadow-lg ${bgGlow} ${borderColor}`}
            >
              {AvatarEmoji}
              
              {/* Little waving hand on entry */}
              {!isTyping && (
                <motion.div
                  initial={{ opacity: 0, rotate: 0, x: -10, y: 10 }}
                  animate={{ opacity: 1, rotate: [0, 20, -10, 20, 0], x: -14, y: 4 }}
                  transition={{ delay: 0.4, duration: 1.5 }}
                  className="absolute -left-1 text-xl"
                >
                  👋
                </motion.div>
              )}
            </motion.div>
            
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
