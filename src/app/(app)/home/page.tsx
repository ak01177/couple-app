"use client";

import { motion } from "framer-motion";
import { FloatingParticles, Avatar, CharacterAvatar, PrivateImage } from "@/components/ui";
import {
  Heart,
  MessageCircle,
  Camera,
  Sparkles,
  Calendar,
  StickyNote,
  Music,
  Sun,
  Moon,
  CloudSun,
  Disc,
  MonitorUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuthStore, usePresenceStore } from "@/store";
import { useSharedNote, useMemories, useCalendarEvents, useSongs } from "@/hooks/useSupabase";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { MOODS } from "@/config/moods";
import { MoodPicker } from "@/components/ui/MoodPicker";
import { IMPORTANT_DATES } from "@/config/dates";
import { getSpotifyEmbedUrl } from "@/lib/spotify";



function useDaysCounter(startDate: string) {
  return useMemo(() => {
    const start = new Date(startDate);
    const now = new Date();
    return Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
  }, [startDate]);
}

function useGreeting() {
  return useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good morning", icon: Sun };
    if (hour < 17) return { text: "Good afternoon", icon: CloudSun };
    return { text: "Good evening", icon: Moon };
  }, []);
}

// --- Cute quotes ---
const quotes = [
  "Every love story is beautiful, but ours is my favorite.",
  "You're my today and all of my tomorrows.",
  "In a sea of people, my eyes will always search for you.",
  "Home is wherever I'm with you.",
  "I choose you. And I'll choose you over and over.",
  "You are my sun, my moon, and all my stars.",
  "Together is a wonderful place to be.",
  "You make my heart smile.",
  "Forever and always.",
  "My favorite place is inside your hug.",
];

// --- Widget Card ---
function WidgetCard({
  children,
  className = "",
  delay = 0,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay,
        duration: 0.45,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`bg-bg-surface border border-border/60 rounded-2xl p-4 shadow-soft ${onClick ? "cursor-pointer active:bg-bg-elevated transition-colors" : ""
        } ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();

  // Supabase dynamic user, partner, and couple data
  const { user, partner, couple } = useAuthStore();
  const partnerPresence = usePresenceStore((s) => s.partnerPresence);
  const anniversaryDate = useMemo(() => {
    const anniversary = IMPORTANT_DATES.find(d => d.type === "anniversary");
    return anniversary ? anniversary.date : couple?.start_date || "2024-01-01";
  }, [couple]);
  const days = useDaysCounter(anniversaryDate);
  const greeting = useGreeting();
  const GreetingIcon = greeting.icon;

  // Random daily quote
  const dailyQuote = useMemo(() => {
    const today = new Date();
    const dayIndex =
      (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate()) %
      quotes.length;
    return quotes[dayIndex];
  }, []);

  // Mood State (from global presence store)
  const myMood = usePresenceStore((s) => s.myMood);
  const partnerMood = usePresenceStore((s) => s.partnerMood);


  // Live Calendar Events
  const { events: calendarEvents } = useCalendarEvents();
  
  // Upcoming Date (merged)
  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let closestEvent: {
      title: string;
      date: string;
      icon: string;
    } | null = null;
    let minDaysLeft = Infinity;

    // 1. Process recurring IMPORTANT_DATES
    for (const event of IMPORTANT_DATES) {
      const eventDate = new Date(event.date);
      const nextOccurrence = new Date(
        today.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate()
      );

      if (nextOccurrence < today) {
        nextOccurrence.setFullYear(today.getFullYear() + 1);
      }

      const diffTime = nextOccurrence.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < minDaysLeft) {
        minDaysLeft = diffDays;
        closestEvent = {
          title: event.title,
          date: nextOccurrence.toISOString(),
          icon: event.icon || "📅"
        };
      }
    }

    // 2. Process live calendar_events
    if (calendarEvents) {
      for (const event of calendarEvents) {
        const eventDate = new Date(event.start_date);
        eventDate.setHours(0, 0, 0, 0);

        if (eventDate >= today) {
          const diffTime = eventDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < minDaysLeft) {
            minDaysLeft = diffDays;
            
            // Map types to icons
            let icon = "📅";
            if (event.type === "date") icon = "🍷";
            if (event.type === "exam") icon = "📝";
            if (event.type === "anniversary") icon = "💝";
            if (event.type === "trip") icon = "✈️";

            closestEvent = {
              title: event.title,
              date: event.start_date,
              icon: icon
            };
          }
        }
      }
    }

    if (!closestEvent) return null;
    return { event: closestEvent, daysLeft: minDaysLeft };
  }, [calendarEvents]);

  // Live Shared Note State
  const { sharedNote, updateNote } = useSharedNote();
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState("");

  const debouncedSaveNote = useDebouncedCallback((text: string) => {
    updateNote(text);
  }, 700);

  const saveNote = () => {
    updateNote(noteInput);
    setIsEditingNote(false);
  };

  // Random Memory
  const { memories } = useMemories();
  const randomMemory = useMemo(() => {
    if (!memories || memories.length === 0) return null;
    const today = new Date();
    const dayIndex = (today.getFullYear() * 366 + today.getMonth() * 31 + today.getDate());
    return memories[dayIndex % memories.length];
  }, [memories]);

  // "On This Day" — memories from same month+day in past years
  const onThisDayMemory = useMemo(() => {
    if (!memories || memories.length === 0) return null;
    const now = new Date();
    const todayMonth = now.getMonth();
    const todayDay = now.getDate();
    const matches = memories.filter(m => {
      const d = new Date(m.date);
      return d.getMonth() === todayMonth && d.getDate() === todayDay && d.getFullYear() < now.getFullYear();
    });
    if (matches.length === 0) return null;
    return matches[Math.floor(Math.random() * matches.length)];
  }, [memories]);

  // Featured Song
  const { songs } = useSongs();
  const featuredSong = useMemo(() => songs.find(s => s.is_featured), [songs]);

  return (
    <div className="h-full overflow-y-auto scroll-smooth">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-accent/3 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] rounded-full bg-pink/3 blur-3xl" />
      </div>

      <FloatingParticles count={8} />

      {/* Content */}
      <div className="relative z-10 px-5 pt-12 pb-8 max-w-lg mx-auto space-y-5">
        {/* --- Greeting Header --- */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 text-text-secondary"
        >
          <GreetingIcon size={18} className="text-accent-light" />
          <span className="text-sm font-medium">{greeting.text}</span>
        </motion.div>

        {/* --- Couple Header --- */}
        <WidgetCard
          className="!bg-bg-surface/80 backdrop-blur-sm overflow-hidden"
          delay={0.05}
        >
          {/* Characters stage — clipped so feet sit on the divider */}
          <div className="flex items-end justify-center gap-6 px-2 pt-2 pb-0">
            {/* Me */}
            <div className="flex flex-col items-center gap-1">
              <CharacterAvatar
                src={user?.avatar_url}
                alt={user?.display_name || "Me"}
                status="online"
                delay={0.1}
                headSize={48}
                shirtColor="#7c3aed"
                pantsColor="#1e1b4b"
                skinColor="#f5c5a3"
              />
              <span className="text-xs font-medium text-text-secondary truncate max-w-[80px] mt-1">
                {user?.display_name || "Me"}
              </span>
            </div>

            {/* Beating heart in the middle */}
            <motion.div
              animate={{ scale: [1, 1.25, 1, 1.15, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="mb-14 shrink-0"
            >
              <Heart size={26} className="text-pink fill-pink drop-shadow-lg" />
            </motion.div>

            {/* Partner */}
            <div className="flex flex-col items-center gap-1">
              <CharacterAvatar
                src={partner?.avatar_url}
                alt={partner?.display_name || "Partner"}
                status={partnerPresence?.status === "online" ? "online" : "offline"}
                delay={0.2}
                headSize={48}
                shirtColor="#ec4899"
                pantsColor="#4a0025"
                skinColor="#f5c5a3"
              />
              <span className="text-xs font-medium text-text-secondary truncate max-w-[80px] mt-1">
                {partner?.display_name || "Partner"}
              </span>
            </div>
          </div>

          {/* Divider line — the "floor" */}
          <div className="h-px bg-border/40 mx-0 mt-2" />

          {/* Days Counter */}
          <div className="text-center py-3">
            <motion.div
              className="text-3xl font-bold gradient-text"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            >
              {days}
            </motion.div>
            <p className="text-text-muted text-xs mt-0.5">
              days together 💕
            </p>
          </div>
        </WidgetCard>

        {/* --- Upcoming Date --- */}
        {upcoming && (
          <WidgetCard delay={0.08}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center shrink-0">
                  <span className="text-xl">{upcoming.event.icon || "📅"}</span>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-info mb-0.5 font-semibold">
                    Upcoming • {new Date(upcoming.event.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-text-secondary font-medium">
                    {upcoming.event.title}
                  </p>
                </div>
              </div>
              <div className="text-right bg-bg-elevated px-3 py-1.5 rounded-xl border border-border/40">
                <p className="text-lg font-bold text-info leading-none mb-1">{upcoming.daysLeft}</p>
                <p className="text-[9px] uppercase tracking-wider text-text-muted leading-none">days</p>
              </div>
            </div>
          </WidgetCard>
        )}

        {/* --- Mood Status Row --- */}
        <div className="grid grid-cols-2 gap-3">
          {/* My Mood */}
          <WidgetCard delay={0.1}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                Your mood
              </p>
              <MoodPicker />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {myMood ? MOODS[myMood.mood]?.emoji : "🤔"}
              </span>
              <span className="text-sm text-text-secondary">
                {myMood ? MOODS[myMood.mood]?.label : "Set mood"}
              </span>
            </div>
          </WidgetCard>

          {/* Partner Mood */}
          <WidgetCard delay={0.15}>
            <p className="text-[10px] uppercase tracking-wider text-text-muted mb-2 font-semibold">
              Their mood
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl mt-[12px]">
                {partnerMood ? MOODS[partnerMood.mood]?.emoji : "—"}
              </span>
              <span className="text-sm text-text-secondary mt-[12px]">
                {partnerMood
                  ? MOODS[partnerMood.mood]?.label
                  : "Not set"}
              </span>
            </div>
          </WidgetCard>
        </div>

        {/* --- Daily Quote --- */}
        <WidgetCard delay={0.2}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={16} className="text-accent-light" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1 font-semibold">
                Daily thought
              </p>
              <p className="text-sm text-text-secondary italic leading-relaxed">
                &ldquo;{dailyQuote}&rdquo;
              </p>
            </div>
          </div>
        </WidgetCard>

        {/* --- Shared Note --- */}
        <WidgetCard
          delay={0.25}
          onClick={!isEditingNote ? () => {
            setNoteInput(sharedNote);
            setIsEditingNote(true);
          } : undefined}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink/10 flex items-center justify-center shrink-0 mt-0.5">
              <StickyNote size={16} className="text-pink-light" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1 font-semibold">
                Shared note
              </p>
              {isEditingNote ? (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={noteInput}
                    onChange={(e) => {
                      setNoteInput(e.target.value);
                      debouncedSaveNote(e.target.value);
                    }}
                    onBlur={saveNote}
                    onKeyDown={(e) =>
                      e.key === "Enter" && saveNote()
                    }
                    className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
                  />
                </div>
              ) : (
                <p className="text-sm text-text-secondary">
                  {sharedNote || "Tap to add a note..."}
                </p>
              )}
            </div>
          </div>
        </WidgetCard>

        {/* --- Movie Night Room --- */}
        <WidgetCard
          delay={0.26}
          onClick={() => router.push("/watch")}
          className="bg-gradient-to-r from-zinc-900 to-black border-accent/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0 shadow-glow">
                <MonitorUp size={20} className="text-accent" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Movie Night</h3>
                <p className="text-[11px] text-text-muted mt-0.5">Join the private theater room</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <span className="text-xs">🍿</span>
            </div>
          </div>
        </WidgetCard>

        {/* --- On This Day --- */}
        {onThisDayMemory && (
          <WidgetCard delay={0.28} onClick={() => router.push("/memories")}>
            <div className="flex items-start gap-3">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-border/40 shrink-0">
                {onThisDayMemory.media_url ? (
                  <PrivateImage path={onThisDayMemory.media_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-bg-elevated flex items-center justify-center">
                    <span className="text-2xl">🌸</span>
                  </div>
                )}
                {/* Glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-xl border-2 border-pink/60"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-pink font-semibold mb-0.5 flex items-center gap-1">
                  <span>✨</span> On This Day
                </p>
                <p className="text-sm font-medium text-text-primary truncate">
                  {onThisDayMemory.title || "A beautiful memory"}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {new Date(onThisDayMemory.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </WidgetCard>
        )}

        {/* --- Our Song --- */}
        {featuredSong && (
          <WidgetCard delay={0.29} onClick={!getSpotifyEmbedUrl(featuredSong.link_url) ? () => router.push("/music") : undefined} className={getSpotifyEmbedUrl(featuredSong.link_url) ? "!p-2" : ""}>
            {(() => {
              const spotifyUrl = getSpotifyEmbedUrl(featuredSong.link_url);
              if (spotifyUrl) {
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-2 pt-1">
                      <p className="text-[10px] uppercase tracking-wider text-success font-bold flex items-center gap-1">
                        Our Song
                      </p>
                      <button onClick={() => router.push("/music")} className="text-text-muted hover:text-success">
                        <Music size={14} />
                      </button>
                    </div>
                    <iframe 
                      src={spotifyUrl} 
                      width="100%" 
                      height="80" 
                      frameBorder="0" 
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                      loading="lazy"
                      className="rounded-lg"
                    ></iframe>
                  </div>
                );
              }
              
              return (
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0 overflow-hidden border border-success/20">
                    <Disc size={20} className="text-success animate-spin-slow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-success font-bold mb-0.5 flex items-center gap-1">
                      Our Song
                    </p>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {featuredSong.title}
                    </p>
                    <p className="text-xs text-text-secondary truncate mt-0.5">
                      {featuredSong.artist}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center shrink-0 shadow-sm border border-border/40">
                    <Music size={14} className="text-text-muted" />
                  </div>
                </div>
              );
            })()}
          </WidgetCard>
        )}

        {/* --- Quick Actions --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45 }}
        >
          <p className="text-[10px] uppercase tracking-wider text-text-muted mb-3 font-semibold px-1">
            Quick Actions
          </p>
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                icon: MessageCircle,
                label: "Chat",
                color: "bg-accent/10 text-accent-light",
                action: () => router.push("/chat"),
              },
              {
                icon: Camera,
                label: "Photo",
                color: "bg-pink/10 text-pink-light",
                action: () => router.push("/memories"),
              },
              {
                icon: Calendar,
                label: "Plans",
                color: "bg-info/10 text-info",
                action: () => router.push("/calendar"),
              },
              {
                icon: Music,
                label: "Music",
                color: "bg-success/10 text-success",
                action: () => router.push("/music"),
              },
            ].map((item, i) => (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.93 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                onClick={item.action}
                className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-bg-surface border border-border/40 hover:bg-bg-elevated transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}
                >
                  <item.icon size={20} />
                </div>
                <span className="text-[11px] font-medium text-text-secondary">
                  {item.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* --- Random Memory Card --- */}
        <WidgetCard delay={0.4} className="overflow-hidden p-0 h-48 relative" onClick={() => router.push("/memories")}>
          {randomMemory && randomMemory.media_url ? (
            <div className="w-full h-full relative">
              <PrivateImage
                path={randomMemory.media_url}
                alt={randomMemory.title || "Memory"}
                autoLoad={true}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5">
                <Heart size={14} className="text-pink" />
                <p className="text-[10px] uppercase tracking-wider text-white/90 font-semibold">
                  Memory • {new Date(randomMemory.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <p className="absolute bottom-8 left-3 z-20 text-sm font-medium text-white truncate right-3">
                {randomMemory.title || "Untitled"}
              </p>
            </div>
          ) : (
            <div className="p-4 flex flex-col items-center justify-center h-full">
              <div className="flex items-center gap-2 mb-3 self-start">
                <Heart size={14} className="text-pink" />
                <p className="text-[10px] uppercase tracking-wider text-text-muted font-semibold">
                  Memory
                </p>
              </div>
              <div className="bg-bg-elevated rounded-xl flex-1 w-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl mb-2">📸</p>
                  <p className="text-xs text-text-muted">
                    Your memories will appear here
                  </p>
                </div>
              </div>
            </div>
          )}
        </WidgetCard>

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </div>
  );
}
