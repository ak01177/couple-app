"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Calendar, Loader2 } from "lucide-react";
import { PrivateImage } from "./PrivateImage";
import { Memory } from "@/types";
import { useDeleteMemory } from "@/hooks/useSupabase";

type MemoryViewerProps = {
  memory: Memory | null;
  onClose: () => void;
};

export function MemoryViewer({ memory, onClose }: MemoryViewerProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteMemory = useDeleteMemory();

  if (!memory) return null;

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this memory?")) {
      setIsDeleting(true);
      await deleteMemory(memory.id, memory.media_url);
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        {/* Top Bar */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="absolute top-0 inset-x-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 to-transparent"
        >
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
          >
            <X size={24} />
          </button>

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            {isDeleting ? <Loader2 size={20} className="animate-spin" /> : <Trash2 size={20} />}
          </button>
        </motion.div>

        {/* Image */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full h-full flex items-center justify-center p-4 pointer-events-none"
        >
          {memory.media_url ? (
            <div className="relative w-full max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl pointer-events-auto bg-bg-surface">
              <PrivateImage
                path={memory.media_url}
                alt={memory.title || "Memory"}
                autoLoad
                className="w-full h-full object-contain max-h-[85vh]"
              />
            </div>
          ) : (
            <div className="w-64 h-64 bg-bg-surface rounded-2xl flex items-center justify-center">
              <span className="text-4xl">💭</span>
            </div>
          )}
        </motion.div>

        {/* Bottom Info Overlay */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="absolute bottom-0 inset-x-0 p-6 pt-12 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none"
        >
          <div className="max-w-4xl mx-auto pointer-events-auto">
            {memory.title && (
              <h2 className="text-2xl font-bold text-white mb-2">{memory.title}</h2>
            )}
            <div className="flex items-center gap-2 text-white/70 text-sm mb-3">
              <Calendar size={14} />
              <span>
                {new Date(memory.date).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            {memory.description && (
              <p className="text-white/90 text-sm leading-relaxed max-w-2xl">
                {memory.description}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
