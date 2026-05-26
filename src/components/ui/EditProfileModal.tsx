"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Check } from "lucide-react";
import { Avatar, Button, Input } from "@/components/ui";
import { useAuthStore } from "@/store";
import { useUpdateProfile, useUpdateCouple } from "@/hooks/useSupabase";
import { createClient } from "@/lib/supabase/client";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, couple } = useAuthStore();
  const updateProfile = useUpdateProfile();
  const updateCouple = useUpdateCouple();

  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [anniversary, setAnniversary] = useState(
    couple?.start_date ? new Date(couple.start_date).toISOString().split("T")[0] : ""
  );
  const [coupleName, setCoupleName] = useState(couple?.name || "");
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("couple_media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // The useUpdateProfile hook doesn't construct public URL, so we construct the path and use normalizeStoragePath
      await updateProfile({ avatar_url: filePath });
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (displayName !== user?.display_name) {
        await updateProfile({ display_name: displayName });
      }
      
      let coupleUpdates: { start_date?: string; name?: string } = {};
      if (anniversary && anniversary !== couple?.start_date) {
        coupleUpdates.start_date = anniversary;
      }
      if (coupleName !== couple?.name) {
        coupleUpdates.name = coupleName;
      }
      
      if (Object.keys(coupleUpdates).length > 0) {
        await updateCouple(coupleUpdates);
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        className="relative w-full max-w-md bg-bg-surface border border-border/60 rounded-3xl p-6 shadow-xl flex flex-col max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-primary">Edit Profile</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Avatar src={user?.avatar_url} alt={user?.display_name || "Me"} size="xl" />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} className="text-white" />
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <p className="text-xs text-text-muted mt-2">Tap to change avatar</p>
        </div>

        <div className="space-y-4">
          <Input
            label="Your Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="What should they call you?"
          />
          
          <div className="border-t border-border/30 my-2" />
          
          <Input
            label="Couple Name (Optional)"
            value={coupleName}
            onChange={(e) => setCoupleName(e.target.value)}
            placeholder="e.g. Brangelina"
          />
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5 ml-1">
              Anniversary Date
            </label>
            <input
              type="date"
              value={anniversary}
              onChange={(e) => setAnniversary(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-3 text-base text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
            />
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border/30 flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="flex-1"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
