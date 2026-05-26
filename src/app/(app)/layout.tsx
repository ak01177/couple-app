"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, MessageCircle, Camera, Settings, Calendar } from "lucide-react";
import { startTransition, useEffect } from "react";
import { useAuth, usePresence } from "@/hooks/useSupabase";
import { useAuthStore, useChatStore } from "@/store";
import { ConnectionBanner } from "@/components/ui/ConnectionBanner";
import { CallProvider } from "@/components/providers/CallProvider";

const tabs = [
  { id: "home" as const, label: "Home", icon: Home, href: "/home" },
  { id: "chat" as const, label: "Chat", icon: MessageCircle, href: "/chat" },
  {
    id: "memories" as const,
    label: "Memories",
    icon: Camera,
    href: "/memories",
  },
  {
    id: "calendar" as const,
    label: "Calendar",
    icon: Calendar,
    href: "/calendar",
  },
  {
    id: "settings" as const,
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Call the hook to listen to auth state & load user/partner/couple details
  useAuth();

  const { user, isLoading, coupleId } = useAuthStore();
  const messages = useChatStore((s) => s.messages);

  // Global presence tracking
  usePresence(coupleId);

  // Count unread messages from partner
  const unreadCount = messages.filter(
    (m) => m.sender_id !== user?.id && !m.read_at
  ).length;

  const activeTab = tabs.find((tab) => pathname.startsWith(tab.href))?.id || "home";

  // Redirect to login if user is not loaded and loading is complete
  useEffect(() => {
    if (!isLoading && !user) {
      startTransition(() => {
        router.replace("/login");
      });
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    tabs.forEach((tab) => router.prefetch(tab.href));
  }, [router]);

  // Premium loading splash screen while loading session details
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-bg-deep flex flex-col items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-glow mb-4"
        >
          <span className="text-white text-2xl">❤️</span>
        </motion.div>
        <p className="text-text-muted text-xs tracking-wider animate-pulse">
          LOADING OUR LITTLE WORLD...
        </p>
      </div>
    );
  }

  // Prevent flashing content if user is null (awaiting redirect)
  if (!user) return null;

  return (
    <CallProvider>
      <div className="flex flex-col h-dvh bg-bg-deep">
        <ConnectionBanner />
        <main className="flex-1 overflow-hidden relative">{children}</main>

        {/* Bottom Navigation */}
        <nav className="relative shrink-0 bg-bg-base/80 backdrop-blur-xl border-t border-border/50 safe-bottom">
          <div className="flex items-center justify-around px-2 h-16 max-w-lg mx-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              const showBadge = tab.id === "chat" && unreadCount > 0 && !isActive;

              return (
                <button
                  key={tab.id}
                  onClick={() => router.push(tab.href)}
                  className="relative flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-colors"
                  aria-label={tab.label}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-px left-3 right-3 h-0.5 gradient-bg rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Icon + badge wrapper */}
                  <div className="relative">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.05 : 1,
                        y: isActive ? -1 : 0,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      }}
                    >
                      <Icon
                        size={22}
                        className={`transition-colors duration-200 ${isActive
                            ? "text-accent"
                            : "text-text-muted"
                          }`}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                    </motion.div>

                    {/* Unread badge */}
                    <AnimatePresence>
                      {showBadge && (
                        <motion.div
                          key="badge"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-pink rounded-full flex items-center justify-center px-0.5 shadow-soft"
                        >
                          <span className="text-white text-[9px] font-bold leading-none">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? "text-accent" : "text-text-muted"
                      }`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </CallProvider>
  );
}
