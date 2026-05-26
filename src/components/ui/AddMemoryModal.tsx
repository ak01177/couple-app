"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Image as ImageIcon, Loader2, Calendar } from "lucide-react";
import { useUploadMedia, useAddMemory } from "@/hooks/useSupabase";
import { compressImage } from "@/lib/imageCompression";
import { revokeBlobUrl } from "@/lib/revokeBlobUrl";

type AddMemoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function AddMemoryModal({ isOpen, onClose }: AddMemoryModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMedia = useUploadMedia();
  const addMemory = useAddMemory();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);

    try {
      const compressed = await compressImage(file);
      const mediaPath = await uploadMedia(compressed, "memories");

      if (mediaPath) {
        // 2. Add memory to database
        // Need to pass date as ISO string or whatever the db expects
        const isoDate = new Date(date).toISOString();
        await addMemory(title.trim() || null, description.trim() || null, mediaPath, isoDate);
        handleClose();
      }
    } catch (error) {
      console.error("Failed to add memory:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    revokeBlobUrl(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setTitle("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setIsUploading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-bg-surface border border-border/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/60">
              <h2 className="text-lg font-bold text-text-primary">Add a Memory</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-4 overflow-y-auto flex-1 space-y-4">

              {/* Image Picker */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-2xl border-2 border-dashed border-border/60 hover:border-accent/50 bg-bg-elevated/50 hover:bg-bg-elevated transition-colors flex flex-col items-center justify-center gap-3 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                      <ImageIcon size={24} />
                    </div>
                    <span className="text-sm font-medium text-text-secondary group-hover:text-text-primary">
                      Select a photo
                    </span>
                  </button>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 ml-1">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Paris Trip 2024"
                  className="w-full bg-bg-elevated border border-border/60 rounded-xl px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 ml-1">
                  Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-bg-elevated border border-border/60 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all [color-scheme:dark]"
                  />
                  <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5 ml-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write something about this moment..."
                  rows={3}
                  className="w-full bg-bg-elevated border border-border/60 rounded-xl px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!file || isUploading}
                  className="w-full bg-accent hover:bg-accent-dark disabled:bg-bg-elevated disabled:text-text-muted text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Save Memory"
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
