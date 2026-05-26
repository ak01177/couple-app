"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePresenceStore } from "@/store";
import { useMood } from "@/hooks/useSupabase";
import { MOODS } from "@/config/moods";

export function MoodPicker() {
  const [isOpen, setIsOpen] = useState(false);
  const myMood = usePresenceStore((s) => s.myMood);
  const { setMood } = useMood();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const currentEmoji = myMood ? MOODS[myMood.mood]?.emoji : "🙂";

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-bg-surface border border-border/60 hover:border-accent/50 flex items-center justify-center shadow-sm text-lg"
        title="Set your mood"
      >
        {currentEmoji}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 mt-2 w-64 bg-bg-surface/95 backdrop-blur-xl border border-border/60 rounded-2xl p-3 shadow-2xl flex flex-wrap gap-2 origin-top-right"
          >
            <div className="w-full text-xs font-semibold text-text-muted mb-1 px-1">
              How are you feeling?
            </div>
            {Object.entries(MOODS).map(([key, { emoji, label }]) => {
              const isSelected = myMood?.mood === key;
              return (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setMood(key);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${isSelected
                      ? "bg-accent/20 border border-accent/40 text-text-primary"
                      : "bg-bg-elevated border border-border/40 text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                    }`}
                >
                  <span>{emoji}</span>
                  <span className="text-xs">{label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
