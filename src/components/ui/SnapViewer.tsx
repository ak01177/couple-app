import { useState } from "react";
import { Message } from "@/types";
import { useEditMessage, useDeleteMedia, useAddMemory } from "@/hooks/useSupabase";
import { createClient } from "@/lib/supabase/client";
import { getPrivateMediaUrl } from "@/lib/storage";
import { revokeBlobUrl } from "@/lib/revokeBlobUrl";
import { X, Download, Save, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function SnapViewer({ message, isMe }: { message: Message; isMe: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const editMessage = useEditMessage();
  const deleteMedia = useDeleteMedia();
  const addMemory = useAddMemory();

  const handleOpen = async () => {
    setIsOpen(true);
    setIsLoading(true);

    try {
      if (!message.media_url) throw new Error("No media url");

      const supabase = createClient();
      const result = await getPrivateMediaUrl(supabase, message.media_url);

      if (result.ok) {
        setImgUrl(result.url);
      }
    } catch {
      // Snap may have been deleted after viewing
    } finally {
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    revokeBlobUrl(imgUrl);
    setIsOpen(false);
    setImgUrl(null);
  };

  const handleCloseDiscard = async () => {
    cleanup();
    // 3. Close -> Update message to "Opened Image" and delete media
    await editMessage(message.id, {
      type: "text",
      content: "Opened image",
      media_url: null,
    });
    if (message.media_url) {
      await deleteMedia(message.media_url);
    }
  };

  const handleDirectDownload = async () => {
    if (!imgUrl) return;
    // Download the image directly
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = "Snap.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    cleanup();
    // 2. Direct Download -> Update message to "Opened Image" and delete media
    await editMessage(message.id, {
      type: "text",
      content: "Opened image",
      media_url: null,
    });
    if (message.media_url) {
      await deleteMedia(message.media_url);
    }
  };

  const handleSaveToChat = async () => {
    cleanup();
    // 1. Save Image -> Keep in supabase, update message to "image" so it renders as PrivateImage
    await editMessage(message.id, {
      type: "image",
      content: "Saved image",
    });
  };

  const handleSaveToMemories = async () => {
    if (!message.media_url) return;
    
    // Add to memories table
    const isoDate = new Date().toISOString();
    await addMemory("Saved from Chat", "A moment saved from our chat timeline.", message.media_url, isoDate);
    
    cleanup();
    
    // Also update chat to "Saved to Memories"
    await editMessage(message.id, {
      type: "text",
      content: "Saved to Memories",
    });
  };

  if (isMe) {
    return (
      <div className="w-48 h-48 mb-2 rounded-xl bg-gradient-to-br from-bg-elevated to-bg-surface border border-border/60 flex flex-col items-center justify-center gap-3 text-text-secondary shadow-soft">
        <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
          <ImageIcon size={24} />
        </div>
        <span className="text-sm font-medium tracking-wide">
          Delivered Snap
        </span>
      </div>
    );
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleOpen}
        className="w-48 h-48 mb-2 rounded-xl bg-gradient-to-br from-bg-elevated to-bg-surface border border-border/60 flex flex-col items-center justify-center gap-3 text-text-secondary hover:text-text-primary transition-colors cursor-pointer shadow-soft group"
      >
        <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
          <ImageIcon size={24} />
        </div>
        <span className="text-sm font-medium tracking-wide">
          Tap to view Snap
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <button
                onClick={handleCloseDiscard}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Discard and Close"
              >
                <X size={24} />
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDirectDownload}
                  disabled={!imgUrl}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  <Download size={18} />
                  <span className="text-sm font-medium hidden sm:inline">Direct Download</span>
                </button>
                <button
                  onClick={handleSaveToMemories}
                  disabled={!imgUrl}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink/20 text-pink-100 hover:bg-pink/30 border border-pink/30 transition-colors shadow-glow disabled:opacity-50"
                >
                  <ImageIcon size={18} />
                  <span className="text-sm font-medium hidden sm:inline">Add to Gallery</span>
                </button>
                <button
                  onClick={handleSaveToChat}
                  disabled={!imgUrl}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-white hover:bg-accent-hover transition-colors shadow-glow disabled:opacity-50"
                >
                  <Save size={18} />
                  <span className="text-sm font-medium hidden sm:inline">Save</span>
                </button>
              </div>
            </div>

            {/* Image Viewer */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center gap-4 text-white/50">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">Loading secure snap...</p>
                </div>
              ) : imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgUrl}
                  alt="Secure Snap"
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <p className="text-white/50">Failed to load snap.</p>
              )}
            </div>

            {/* Bottom info */}
            <div className="p-4 text-center text-white/50 text-xs bg-gradient-to-t from-black/80 to-transparent">
              Warning: Closing this without saving or downloading will delete it forever!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
