"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar as CalendarIcon, Loader2, Type } from "lucide-react";
import { useCalendarEvents } from "@/hooks/useSupabase";
import { CalendarEventType } from "@/types";

type AddEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
};

const EVENT_TYPES: { value: CalendarEventType; label: string; icon: string }[] = [
  { value: "date", label: "Date", icon: "🍷" },
  { value: "exam", label: "Exam", icon: "📝" },
  { value: "anniversary", label: "Anniversary", icon: "💝" },
  { value: "trip", label: "Trip", icon: "✈️" },
  { value: "other", label: "Other", icon: "📅" },
];

export function AddEventModal({ isOpen, onClose, initialDate }: AddEventModalProps) {
  const { addEvent } = useCalendarEvents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarEventType>("date");
  
  // Format dates for datetime-local input
  const getInitialDateStr = () => {
    const d = initialDate || new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [startDate, setStartDate] = useState(getInitialDateStr());
  const [endDate, setEndDate] = useState(getInitialDateStr());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !endDate) return;

    setIsSubmitting(true);
    try {
      await addEvent({
        title: title.trim(),
        type,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      });
      setTitle("");
      setStartDate(getInitialDateStr());
      setEndDate(getInitialDateStr());
      onClose();
    } catch (error) {
      console.error("Failed to add event:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-bg-surface/90 backdrop-blur-2xl border border-border/60 rounded-3xl p-6 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent via-pink to-accent/50" />
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <CalendarIcon className="text-accent" />
                Add Event
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider block">
                  Event Title
                </label>
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Math Final Exam"
                    className="w-full bg-bg-elevated border border-border/40 rounded-xl py-3 pl-10 pr-4 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider block">
                  Event Type
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                        type === t.value
                          ? "bg-accent/20 border-accent/50 text-text-primary"
                          : "bg-bg-elevated border-border/40 text-text-muted hover:bg-bg-hover hover:text-text-secondary"
                      }`}
                    >
                      <span className="text-xl">{t.icon}</span>
                      <span className="text-[10px] font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider block">
                    Starts
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-bg-elevated border border-border/40 rounded-xl py-2.5 px-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider block">
                    Ends
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-bg-elevated border border-border/40 rounded-xl py-2.5 px-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="w-full mt-6 bg-accent hover:bg-accent-hover text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Save Event"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
