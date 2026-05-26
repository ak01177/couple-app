"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { EditProfileModal } from "@/components/ui/EditProfileModal";
import { useAuthStore } from "@/store";
import { signOut } from "@/lib/auth";
import {
  User,
  Shield,
  Bell,
  Heart,
  LogOut,
  ChevronRight,
  Moon,
  Sparkles,
} from "lucide-react";


interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  danger?: boolean;
}

function SettingsItem({
  icon,
  label,
  description,
  onClick,
  trailing,
  danger = false,
}: SettingsItemProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl hover:bg-bg-elevated transition-colors text-left"
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${danger ? "bg-error/10 text-error" : "bg-bg-elevated text-text-secondary"
          }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${danger ? "text-error" : "text-text-primary"
            }`}
        >
          {label}
        </p>
        {description && (
          <p className="text-xs text-text-muted mt-0.5">{description}</p>
        )}
      </div>
      {trailing || (
        <ChevronRight
          size={16}
          className={danger ? "text-error/50" : "text-text-muted"}
        />
      )}
    </motion.button>
  );
}

export default function SettingsPage() {
  const { user, partner } = useAuthStore();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-bg-deep">
      <div className="relative z-10 px-5 pt-12 pb-8 max-w-lg mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Customize your space
          </p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-bg-surface border border-border/60 rounded-2xl p-5 shadow-soft"
        >
          <div className="flex items-center gap-4">
            <Avatar src={user?.avatar_url} alt={user?.display_name || "Me"} size="xl" status="online" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-text-primary">{user?.display_name || "Me"}</h2>
              <p className="text-sm text-text-muted">Online</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Heart size={12} className="text-pink fill-pink" />
                <span className="text-xs text-text-muted">
                  Paired with {partner?.display_name || "Partner"} 💕
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Settings Groups */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-bg-surface border border-border/60 rounded-2xl shadow-soft overflow-hidden"
        >
          <SettingsItem
            icon={<User size={18} />}
            label="Edit Profile"
            description="Name, avatar, display preferences"
            onClick={() => setIsEditModalOpen(true)}
          />
          <div className="mx-4 border-t border-border/30" />
          <SettingsItem
            icon={<Heart size={18} />}
            label="Relationship"
            description="Anniversary, couple name"
            onClick={() => setIsEditModalOpen(true)}
          />
          <div className="mx-4 border-t border-border/30" />
          <SettingsItem
            icon={<Bell size={18} />}
            label="Notifications"
            description="Sounds, vibration, alerts"
          />
          <div className="mx-4 border-t border-border/30" />
          <SettingsItem
            icon={<Moon size={18} />}
            label="Appearance"
            description="Dark mode, font size"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-bg-surface border border-border/60 rounded-2xl shadow-soft overflow-hidden"
        >
          <SettingsItem
            icon={<Shield size={18} />}
            label="Privacy & Security"
            description="Password, sessions, data"
          />
          <div className="mx-4 border-t border-border/30" />
          <SettingsItem
            icon={<Sparkles size={18} />}
            label="About AS"
            description="Version 1.0 — Made with love"
          />
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-bg-surface border border-border/60 rounded-2xl shadow-soft overflow-hidden"
        >
          <SettingsItem
            icon={<LogOut size={18} />}
            label={isSigningOut ? "Signing out..." : "Sign Out"}
            danger
            onClick={handleSignOut}
          />
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center pt-4 pb-6"
        >
          <p className="text-xs text-text-muted">
            Made with 💕 for {user?.display_name || "Me"} & {partner?.display_name || "Partner"}
          </p>
          <p className="text-[10px] text-text-muted/60 mt-1">
            v1.0.0
          </p>
        </motion.div>
      </div>
      
      <AnimatePresence>
        {isEditModalOpen && (
          <EditProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
