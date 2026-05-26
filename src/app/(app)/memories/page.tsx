"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FloatingParticles, Skeleton } from "@/components/ui";
import { AddMemoryModal, MemoryViewer } from "@/components/ui";
import { PrivateImage } from "@/components/ui/PrivateImage";
import { Image as ImageIcon, Heart, Plus, Grid3X3, LayoutList, Calendar, Sparkles } from "lucide-react";
import { useMemories } from "@/hooks/useSupabase";
import { Memory } from "@/types";

export default function MemoriesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const { memories, isLoading } = useMemories();

  const onThisDayMemory = useMemo(() => {
    if (!memories.length) return null;
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    const todayYear = today.getFullYear();

    return memories.find((m) => {
      const d = new Date(m.date);
      return (
        d.getMonth() === todayMonth &&
        d.getDate() === todayDate &&
        d.getFullYear() < todayYear
      );
    });
  }, [memories]);

  const groupedMemories = useMemo(() => {
    const groups: { [key: string]: Memory[] } = {};
    memories.forEach((m) => {
      const d = new Date(m.date);
      const key = d.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [memories]);

  return (
    <div className="h-full overflow-y-auto bg-bg-deep relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 right-0 w-[300px] h-[300px] rounded-full bg-pink/3 blur-3xl" />
        <div className="absolute bottom-1/3 left-0 w-[250px] h-[250px] rounded-full bg-accent/3 blur-3xl" />
      </div>

      <FloatingParticles count={5} />

      <div className="relative z-10 px-4 sm:px-6 pt-12 pb-24 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Memories</h1>
            <p className="text-sm text-text-muted mt-0.5">Our shared moments</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-surface border border-transparent hover:border-border/60 transition-all shadow-sm"
            >
              {viewMode === "grid" ? <LayoutList size={18} /> : <Grid3X3 size={18} />}
            </button>
          </div>
        </motion.div>

        {/* Upload Area */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full py-8 rounded-3xl border-2 border-dashed border-border/60 hover:border-accent/40 bg-bg-surface/30 hover:bg-bg-surface transition-all flex flex-col items-center gap-3 group shadow-sm hover:shadow-md"
          >
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors group-hover:scale-105 duration-300">
              <Plus size={28} className="text-accent" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-secondary group-hover:text-text-primary transition-colors">
                Add a memory
              </p>
              <p className="text-xs text-text-muted mt-0.5">Upload a photo to our timeline</p>
            </div>
          </button>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" className="h-52 rounded-3xl" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && memories.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-border/60">
              <ImageIcon size={32} className="text-text-muted" />
            </div>
            <p className="text-text-primary font-medium">No memories yet</p>
            <p className="text-sm text-text-muted mt-1">
              Add your first photo to start your shared gallery.
            </p>
          </motion.div>
        )}

        {/* On This Day Resurfacing */}
        {!isLoading && onThisDayMemory && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-accent" size={18} />
              <h2 className="text-lg font-bold text-text-primary">
                On this day,{" "}
                {new Date().getFullYear() - new Date(onThisDayMemory.date).getFullYear()}{" "}
                year
                {new Date().getFullYear() - new Date(onThisDayMemory.date).getFullYear() > 1
                  ? "s"
                  : ""}{" "}
                ago
              </h2>
            </div>
            <div className={viewMode === "grid" ? "columns-1 sm:columns-2 lg:columns-3 gap-4" : "max-w-2xl mx-auto"}>
              <MemoryCard
                memory={onThisDayMemory}
                viewMode={viewMode}
                onClick={() => setSelectedMemory(onThisDayMemory)}
                isHighlight
              />
            </div>
          </motion.div>
        )}

        {/* Memories Timeline */}
        {!isLoading && memories.length > 0 && (
          <div className="space-y-12">
            {Object.entries(groupedMemories).map(([monthYear, groupMemories]) => (
              <div key={monthYear}>
                {/* Sticky Header */}
                <div className="sticky top-0 z-20 bg-bg-deep/90 backdrop-blur-md py-3 mb-4 -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-border/20">
                  <h2 className="text-base font-bold text-text-primary">
                    {monthYear}
                  </h2>
                </div>

                <div
                  className={
                    viewMode === "grid"
                      ? "columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4"
                      : "space-y-4 max-w-2xl mx-auto"
                  }
                >
                  {groupMemories.map((memory) => (
                    <MemoryCard
                      key={memory.id}
                      memory={memory}
                      viewMode={viewMode}
                      onClick={() => setSelectedMemory(memory)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <AddMemoryModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      {selectedMemory && (
        <MemoryViewer memory={selectedMemory} onClose={() => setSelectedMemory(null)} />
      )}
    </div>
  );
}

function MemoryCard({ memory, viewMode, onClick, isHighlight = false }: { memory: Memory, viewMode: "grid" | "list", onClick: () => void, isHighlight?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`content-auto relative bg-bg-surface border overflow-hidden shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 break-inside-avoid ${
        isHighlight ? "border-accent/50 rounded-3xl ring-2 ring-accent/20" : "border-border/60 rounded-3xl hover:border-border"
      } ${viewMode === "list" ? "flex items-start p-4 gap-4" : "group mb-4"}`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden ${viewMode === "list" ? "w-24 h-24 rounded-2xl shrink-0" : "w-full"}`}>
        {memory.media_url ? (
          <PrivateImage
            path={memory.media_url}
            alt={memory.title || "Memory"}
            autoLoad={false}
            className={`w-full object-cover transition-transform duration-700 group-hover:scale-105 ${viewMode === "list" ? "h-full" : "min-h-[200px]"}`}
          />
        ) : (
          <div className="w-full h-32 bg-accent/10 flex items-center justify-center">
            <Heart className="text-accent/40" />
          </div>
        )}
        {/* Overlay gradient for grid mode */}
        {viewMode === "grid" && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
        )}
      </div>

      {/* Info */}
      <div className={`${viewMode === "grid" ? "absolute bottom-0 inset-x-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300" : "flex-1 min-w-0"}`}>
        <h3 className={`font-medium truncate ${viewMode === "grid" ? "text-white text-base mb-1" : "text-text-primary text-base mb-1"}`}>
          {memory.title || "Untitled Memory"}
        </h3>
        <div className={`flex items-center gap-1.5 text-xs ${viewMode === "grid" ? "text-white/80" : "text-text-muted"}`}>
          <Calendar size={12} />
          <span>
            {new Date(memory.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        {viewMode === "list" && memory.description && (
          <p className="text-sm text-text-muted mt-2 line-clamp-2 leading-relaxed">
            {memory.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
