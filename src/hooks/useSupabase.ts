"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getPosterUrl } from "@/app/actions/getPoster";
import { useAuthStore, useChatStore, usePresenceStore, useCalendarStore } from "@/store";
import type { Message, MoodStatus, Memory, CalendarEvent } from "@/types";
import { COUPLE_MEDIA_BUCKET, normalizeStoragePath } from "@/lib/storage";
import { invalidateCachedMedia } from "@/lib/mediaCache";

const PAGE_SIZE = 50;

const MESSAGE_SELECT = `
  *,
  sender:profiles!sender_id(*),
  reactions(*),
  reply_to:messages!reply_to_id(*)
`;

// ============================================
// useAuth — Load user + partner data
// ============================================
export function useAuth() {
  const { setUser, setPartner, setCoupleId, setCouple, setLoading } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    async function loadUserData() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setLoading(false);
          return;
        }

        // Load profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profile) {
          setUser(profile);
          setCoupleId(profile.couple_id);

          if (profile.couple_id) {
            const [{ data: couple }, { data: partner }] = await Promise.all([
              supabase
                .from("couples")
                .select("*")
                .eq("id", profile.couple_id)
                .single(),
              supabase
                .from("profiles")
                .select("*")
                .eq("couple_id", profile.couple_id)
                .neq("id", authUser.id)
                .maybeSingle(),
            ]);

            if (couple) setCouple(couple);
            if (partner) setPartner(partner);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setPartner(null);
        setCoupleId(null);
        setCouple(null);
        setLoading(false);
      } else {
        loadUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setPartner, setCoupleId, setCouple, setLoading]);
}

// ============================================
// useUpdateProfile — Update user profile
// ============================================
export function useUpdateProfile() {
  const { user, setUser } = useAuthStore();
  
  return async (updates: { display_name?: string; avatar_url?: string }) => {
    if (!user) return;
    const supabase = createClient();
    
    const { error, data } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
      
    if (!error && data) {
      setUser(data);
    }
    return { error, data };
  };
}

// ============================================
// useUpdateCouple — Update couple settings
// ============================================
export function useUpdateCouple() {
  const { couple, setCouple } = useAuthStore();
  
  return async (updates: { start_date?: string; name?: string }) => {
    if (!couple) return;
    const supabase = createClient();
    
    const { error, data } = await supabase
      .from("couples")
      .update(updates)
      .eq("id", couple.id)
      .select()
      .single();
      
    if (!error && data) {
      setCouple(data);
    }
    return { error, data };
  };
}

// ============================================
// useMessages — Load messages + realtime
// ============================================
export function useMessages(coupleId: string | null) {
  const {
    setMessages,
    addMessage,
    prependMessages,
    updateMessage,
    setLoadingMessages,
    setHasMore,
  } = useChatStore();

  // Load initial messages
  useEffect(() => {
    if (!coupleId) {
      useChatStore.getState().reset();
      return;
    }

    const supabase = createClient();

    async function loadMessages() {
      setLoadingMessages(true);

      const { data, error } = await supabase
        .from("messages")
        .select(MESSAGE_SELECT)
        .eq("couple_id", coupleId)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (!error && data) {
        setMessages(data.reverse());
        setHasMore(data.length === PAGE_SIZE);
      }

      setLoadingMessages(false);
    }

    loadMessages();
  }, [coupleId, setMessages, setLoadingMessages, setHasMore]);

  // Realtime subscription
  useEffect(() => {
    if (!coupleId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `couple_id=eq.${coupleId}`,
        },
        async (payload) => {
          // Check if this message was already added optimistically
          const existing = useChatStore.getState().messages.find(m => m.id === payload.new.id);
          if (existing) return;

          // Load full message with relations
          const { data } = await supabase
            .from("messages")
            .select(MESSAGE_SELECT)
            .eq("id", payload.new.id)
            .maybeSingle();

          if (data) addMessage(data);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `couple_id=eq.${coupleId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select(MESSAGE_SELECT)
            .eq("id", payload.new.id)
            .maybeSingle();

          if (data) updateMessage(data.id, data);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, addMessage, updateMessage]);

  // Load older messages (pagination)
  const loadMore = useCallback(async () => {
    if (!coupleId) return;

    const messages = useChatStore.getState().messages;
    if (messages.length === 0) return;

    const supabase = createClient();
    const oldestMessage = messages[0];

    const { data } = await supabase
      .from("messages")
      .select(MESSAGE_SELECT)
      .eq("couple_id", coupleId)
      .lt("created_at", oldestMessage.created_at)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (data) {
      prependMessages(data.reverse());
      setHasMore(data.length === PAGE_SIZE);
    }
  }, [coupleId, prependMessages, setHasMore]);

  return { loadMore };
}

// ============================================
// useMarkMessagesRead — Mark partner messages read in chat
// ============================================
export function useMarkMessagesRead(coupleId: string | null) {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!coupleId || !user) return;

    const supabase = createClient();

    async function markRead() {
      const now = new Date().toISOString();
      await supabase
        .from("messages")
        .update({ read_at: now })
        .eq("couple_id", coupleId)
        .neq("sender_id", user!.id)
        .is("read_at", null);

      useChatStore.getState().messages.forEach((m) => {
        if (m.sender_id !== user!.id && !m.read_at) {
          useChatStore.getState().updateMessage(m.id, { read_at: now });
        }
      });
    }

    markRead();
  }, [coupleId, user]);
}

// ============================================
// useSendMessage — Send a new message
// ============================================
export function useSendMessage() {
  const { user, coupleId } = useAuthStore();

  return async (content: string, replyToId?: string, type: Message["type"] = "text", mediaUrl?: string) => {
    if (!user || !coupleId) return null;

    const supabase = createClient();

    const { data, error } = await supabase
      .from("messages")
      .insert({
        content: content || null,
        type,
        media_url: mediaUrl || null,
        reply_to_id: replyToId || null,
        sender_id: user.id,
        couple_id: coupleId,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error sending message:", error);
      return null;
    }

    return data;
  };
}

export function useEditMessage() {
  const { user } = useAuthStore();

  return async (messageId: string, updates: Partial<Message>) => {
    if (!user) return;
    const supabase = createClient();

    const previous = useChatStore
      .getState()
      .messages.find((m) => m.id === messageId);

    useChatStore.getState().updateMessage(messageId, updates);

    const { error } = await supabase
      .from("messages")
      .update(updates)
      .eq("id", messageId);

    if (error) {
      console.error("Failed to update message", error);
      if (previous) {
        useChatStore.getState().updateMessage(messageId, previous);
      }
    }
  };
}

// ============================================
// useReactions — Add/remove reactions
// ============================================
export function useReactions() {
  const user = useAuthStore((s) => s.user);
  const coupleId = useAuthStore((s) => s.coupleId);

  useEffect(() => {
    if (!coupleId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`reactions:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reactions",
        },
        async (payload) => {
          const record = (payload.new && Object.keys(payload.new).length > 0)
            ? (payload.new as any)
            : (payload.old as any);

          const msgId = record?.message_id;
          if (!msgId) return;

          const existing = useChatStore.getState().messages.find(m => m.id === msgId);
          if (!existing) return;

          const { data } = await supabase
            .from("reactions")
            .select("*")
            .eq("message_id", msgId);

          if (data) {
            useChatStore.getState().updateMessage(msgId, { reactions: data });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user) return;

      const supabase = createClient();

      // Check if reaction exists
      const { data: existing } = await supabase
        .from("reactions")
        .select("id")
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        await supabase.from("reactions").delete().eq("id", existing.id);
      } else {
        await supabase.from("reactions").insert({
          emoji,
          message_id: messageId,
          user_id: user.id,
        });
      }

      // Reload reactions for this message and update local state
      const { data: updatedReactions } = await supabase
        .from("reactions")
        .select("*")
        .eq("message_id", messageId);

      useChatStore.getState().updateMessage(messageId, {
        reactions: updatedReactions || [],
      });
    },
    [user]
  );

  return { toggleReaction };
}

// ============================================
// usePresence — Online/typing presence
// ============================================
let presenceRealtimeSubscribers = 0;
let presenceRealtimeCoupleId: string | null = null;
let presenceRealtimeChannel: ReturnType<
  ReturnType<typeof createClient>["channel"]
> | null = null;
let presenceTypingTimeout: NodeJS.Timeout | null = null;

function startPresenceRealtime(coupleId: string, pathname: string) {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const supabase = createClient();
  stopPresenceRealtime();

  presenceRealtimeCoupleId = coupleId;
  const channel = supabase.channel(`presence:${coupleId}`, {
    config: { presence: { key: user.id } },
  });
  
  presenceRealtimeChannel = channel;

  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      let foundPartner = false;
      const setPartnerPresence = usePresenceStore.getState().setPartnerPresence;
      
      for (const [key, presences] of Object.entries(state)) {
        if (key !== user.id && presences.length > 0) {
          foundPartner = true;
          const p = presences[0] as unknown as {
            status: string;
            is_typing: boolean;
            current_path?: string;
          };
          setPartnerPresence({
            user_id: key,
            status: (p.status as "online" | "offline" | "away") || "online",
            last_seen: new Date().toISOString(),
            is_typing: p.is_typing || false,
            current_path: p.current_path,
          });
        }
      }
      if (!foundPartner) {
        setPartnerPresence(null);
      }
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          status: "online",
          is_typing: false,
          current_path: pathname,
          last_seen: new Date().toISOString(),
        });
      }
    });
}

function stopPresenceRealtime() {
  if (presenceRealtimeChannel) {
    const supabase = createClient();
    supabase.removeChannel(presenceRealtimeChannel);
    presenceRealtimeChannel = null;
    presenceRealtimeCoupleId = null;
    if (presenceTypingTimeout) {
      clearTimeout(presenceTypingTimeout);
      presenceTypingTimeout = null;
    }
  }
}

export function usePresence(coupleId: string | null) {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();

  useEffect(() => {
    if (!coupleId || !user) {
      usePresenceStore.getState().setPartnerPresence(null);
      return;
    }

    presenceRealtimeSubscribers += 1;

    if (presenceRealtimeSubscribers === 1) {
      startPresenceRealtime(coupleId, pathname);
    } else if (presenceRealtimeCoupleId !== coupleId) {
      startPresenceRealtime(coupleId, pathname);
    }

    return () => {
      presenceRealtimeSubscribers -= 1;
      if (presenceRealtimeSubscribers <= 0) {
        presenceRealtimeSubscribers = 0;
        stopPresenceRealtime();
      }
    };
  }, [coupleId, user]); // Note: excluding pathname to avoid reconnecting on every route change

  // Update presence when pathname changes (without reconnecting channel)
  useEffect(() => {
    if (presenceRealtimeChannel && presenceRealtimeSubscribers > 0) {
      presenceRealtimeChannel.track({
        status: "online",
        is_typing: false,
        current_path: pathname,
        last_seen: new Date().toISOString(),
      });
    }
  }, [pathname]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!coupleId || !user) return;

    const channel = presenceRealtimeChannel;
    if (!channel) return;

    if (presenceTypingTimeout) {
      clearTimeout(presenceTypingTimeout);
      presenceTypingTimeout = null;
    }

    await channel.track({
      status: "online",
      is_typing: isTyping,
      current_path: pathname,
      last_seen: new Date().toISOString(),
    });

    if (isTyping) {
      presenceTypingTimeout = setTimeout(() => {
        if (presenceRealtimeChannel) {
          presenceRealtimeChannel.track({
            status: "online",
            is_typing: false,
            current_path: pathname,
            last_seen: new Date().toISOString(),
          });
        }
      }, 3000);
    }
  }, [coupleId, user, pathname]);

  return { setTyping };
}

// ============================================
// useMood — Get/set mood status
// ============================================
export function useMood() {
  const user = useAuthStore((s) => s.user);
  const coupleId = useAuthStore((s) => s.coupleId);
  const { setPartnerMood, setMyMood } = usePresenceStore();

  // Load latest moods
  useEffect(() => {
    if (!coupleId || !user) return;

    const supabase = createClient();

    async function loadMoods() {
      // Load my mood
      const { data: myMood } = await supabase
        .from("mood_statuses")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (myMood) setMyMood(myMood);

      // Load partner's mood
      const { data: partner } = await supabase
        .from("profiles")
        .select("id")
        .eq("couple_id", coupleId)
        .neq("id", user!.id)
        .single();

      if (!partner) return;

      const { data: pMood } = await supabase
        .from("mood_statuses")
        .select("*")
        .eq("user_id", partner.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pMood) setPartnerMood(pMood);
    }

    loadMoods();

    // Realtime mood updates
    const channel = supabase
      .channel(`mood:${coupleId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mood_statuses",
        },
        (payload) => {
          const newMood = payload.new as MoodStatus;
          const partnerId = useAuthStore.getState().partner?.id;
          if (newMood.user_id === user?.id) {
            setMyMood(newMood);
          } else if (partnerId && newMood.user_id === partnerId) {
            setPartnerMood(newMood);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, user, setPartnerMood, setMyMood]);

  const setMood = useCallback(
    async (mood: string) => {
      if (!user) return;

      const supabase = createClient();
      await supabase.from("mood_statuses").insert({
        mood,
        user_id: user.id,
      });
    },
    [user]
  );

  return { setMood };
}

// ============================================
// useSharedNote — Get/set shared notes
// ============================================
export function useSharedNote() {
  const user = useAuthStore((s) => s.user);
  const coupleId = useAuthStore((s) => s.coupleId);
  const { sharedNote, setSharedNote } = usePresenceStore();

  // Load shared note
  useEffect(() => {
    if (!coupleId || !user) return;

    const supabase = createClient();

    async function loadNote() {
      const { data, error } = await supabase
        .from("shared_notes")
        .select("*")
        .eq("couple_id", coupleId)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setSharedNote(data[0].content);
      }
    }

    loadNote();

    // Realtime subscription
    const channel = supabase
      .channel(`shared_notes:${coupleId}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shared_notes",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          if (payload.new && "content" in payload.new) {
            setSharedNote(payload.new.content as string);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId, user, setSharedNote]);

  const persistNote = useCallback(
    async (content: string) => {
      if (!coupleId || !user) return;

      const supabase = createClient();
      setSharedNote(content);

      const { data: existing } = await supabase
        .from("shared_notes")
        .select("id")
        .eq("couple_id", coupleId)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from("shared_notes")
          .update({ content, updated_at: new Date().toISOString() })
          .eq("id", existing[0].id);
      } else {
        await supabase.from("shared_notes").insert({
          content,
          couple_id: coupleId,
        });
      }
    },
    [coupleId, user, setSharedNote]
  );

  return { sharedNote, updateNote: persistNote };
}

// ============================================
// useCalendarEvents — single realtime channel (shared store)
// ============================================
let calendarRealtimeSubscribers = 0;
let calendarRealtimeCoupleId: string | null = null;
let calendarRealtimeChannel: ReturnType<
  ReturnType<typeof createClient>["channel"]
> | null = null;

async function fetchCalendarEvents(coupleId: string) {
  const { setEvents, setLoading } = useCalendarStore.getState();
  setLoading(true);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("couple_id", coupleId)
    .order("start_date", { ascending: true });

  if (!error && data) {
    setEvents(data);
  }
  setLoading(false);
}

function startCalendarRealtime(coupleId: string) {
  const supabase = createClient();
  stopCalendarRealtime();

  calendarRealtimeCoupleId = coupleId;
  calendarRealtimeChannel = supabase
    .channel(`calendar_events:${coupleId}-${crypto.randomUUID()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "calendar_events",
        filter: `couple_id=eq.${coupleId}`,
      },
      () => {
        void fetchCalendarEvents(coupleId);
      }
    )
    .subscribe();
}

function stopCalendarRealtime() {
  if (calendarRealtimeChannel) {
    const supabase = createClient();
    supabase.removeChannel(calendarRealtimeChannel);
    calendarRealtimeChannel = null;
    calendarRealtimeCoupleId = null;
  }
}

export function useCalendarEvents() {
  const coupleId = useAuthStore((s) => s.coupleId);
  const user = useAuthStore((s) => s.user);
  const events = useCalendarStore((s) => s.events);
  const isLoading = useCalendarStore((s) => s.isLoading);

  useEffect(() => {
    if (!coupleId) {
      useCalendarStore.getState().reset();
      return;
    }

    calendarRealtimeSubscribers += 1;

    if (calendarRealtimeSubscribers === 1) {
      void fetchCalendarEvents(coupleId);
      startCalendarRealtime(coupleId);
    } else if (calendarRealtimeCoupleId !== coupleId) {
      void fetchCalendarEvents(coupleId);
      startCalendarRealtime(coupleId);
    }

    return () => {
      calendarRealtimeSubscribers -= 1;
      if (calendarRealtimeSubscribers <= 0) {
        calendarRealtimeSubscribers = 0;
        stopCalendarRealtime();
      }
    };
  }, [coupleId]);

  const addEvent = useCallback(
    async (
      eventData: Omit<
        CalendarEvent,
        "id" | "created_at" | "user_id" | "couple_id"
      >
    ) => {
      if (!coupleId || !user) return;
      const supabase = createClient();
      const { error } = await supabase.from("calendar_events").insert({
        ...eventData,
        user_id: user.id,
        couple_id: coupleId,
      });
      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      if (coupleId) void fetchCalendarEvents(coupleId);
    },
    [coupleId, user]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      if (!user || !coupleId) return;
      const supabase = createClient();
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", eventId)
        .eq("user_id", user.id);
      if (!error) void fetchCalendarEvents(coupleId);
    },
    [user, coupleId]
  );

  return { events, isLoading, addEvent, deleteEvent };
}

// ============ STORAGE ============

export function useUploadMedia() {
  const { coupleId } = useAuthStore();

  return async (file: File, folder: string = "chat") => {
    if (!coupleId) return null;

    const supabase = createClient();
    const fileExt =
      file.name.split(".").pop() ||
      file.type.split("/")[1]?.split("+")[0] ||
      "bin";
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${coupleId}/${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from(COUPLE_MEDIA_BUCKET)
      .upload(filePath, file);

    if (error) {
      console.error("Upload failed", error);
      return null;
    }

    // Return the private file path instead of a public URL
    return filePath;
  };
}

export function useDeleteMedia() {
  const { coupleId } = useAuthStore();

  return async (path: string) => {
    if (!coupleId || !path) return;
    const supabase = createClient();
    const storagePath = normalizeStoragePath(path);
    if (!storagePath) return;
    invalidateCachedMedia(storagePath);

    const { error } = await supabase.storage
      .from(COUPLE_MEDIA_BUCKET)
      .remove([storagePath]);
    if (error) {
      console.error("Failed to delete media", error);
    }
  };
}

// ============ MEMORIES ============

export function useMemories() {
  const { coupleId } = useAuthStore();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) return;

    const supabase = createClient();
    let isMounted = true;

    async function fetchMemories() {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .eq("couple_id", coupleId)
        .order("date", { ascending: false });

      if (!error && data && isMounted) {
        setMemories(data);
      }
      if (isMounted) setIsLoading(false);
    }

    fetchMemories();

    const channel = supabase
      .channel(`memories:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "memories",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          setMemories((prev) => {
            const newMemories = [payload.new as Memory, ...prev];
            return newMemories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "memories",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          setMemories((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  return { memories, isLoading };
}

export function useAddMemory() {
  const { coupleId } = useAuthStore();

  return async (
    title: string | null,
    description: string | null,
    mediaUrl: string,
    date: string
  ) => {
    if (!coupleId) return null;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("memories")
      .insert({
        title,
        description,
        media_url: mediaUrl,
        date,
        couple_id: coupleId,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error adding memory:", error);
      return null;
    }
    return data;
  };
}

export function useDeleteMemory() {
  const { coupleId } = useAuthStore();
  const deleteMedia = useDeleteMedia();

  return async (id: string, mediaUrl?: string | null) => {
    if (!coupleId) return;

    if (mediaUrl) {
      await deleteMedia(mediaUrl);
    }

    const supabase = createClient();
    const { error } = await supabase.from("memories").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete memory", error);
    }
  };
}

export function useSongs() {
  const { coupleId } = useAuthStore();
  const [songs, setSongs] = useState<import("@/types").CoupleSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!coupleId) return;

    const supabase = createClient();

    const fetchSongs = async () => {
      const { data, error } = await supabase
        .from("couple_songs")
        .select("*")
        .eq("couple_id", coupleId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch songs", error);
      } else {
        setSongs(data || []);
      }
      setIsLoading(false);
    };

    fetchSongs();

    const channel = supabase
      .channel(`songs:${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "couple_songs",
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          fetchSongs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  return { songs, isLoading };
}

export function useAddSong() {
  const { coupleId, user } = useAuthStore();

  return async (songData: Omit<import("@/types").CoupleSong, "id" | "added_by" | "couple_id" | "created_at" | "is_featured">) => {
    if (!coupleId || !user) return;

    const supabase = createClient();
    const { error } = await supabase.from("couple_songs").insert({
      ...songData,
      added_by: user.id,
      couple_id: coupleId,
    });

    if (error) {
      console.error("Failed to add song", error);
    }
  };
}

export function useDeleteSong() {
  const { coupleId } = useAuthStore();

  return async (id: string) => {
    if (!coupleId) return;

    const supabase = createClient();
    const { error } = await supabase.from("couple_songs").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete song", error);
    }
  };
}

export function useToggleFeaturedSong() {
  const { coupleId } = useAuthStore();

  return async (id: string, is_featured: boolean) => {
    if (!coupleId) return;

    const supabase = createClient();

    // If setting a new featured song, unfeature all others first
    if (is_featured) {
      await supabase
        .from("couple_songs")
        .update({ is_featured: false })
        .eq("couple_id", coupleId);
    }

    const { error } = await supabase
      .from("couple_songs")
      .update({ is_featured })
      .eq("id", id);

    if (error) {
      console.error("Failed to toggle featured song", error);
    }
  };
}

export function useMovies() {
  const { coupleId } = useAuthStore();
  const [movies, setMovies] = useState<import("@/types").Movie[]>([]);

  useEffect(() => {
    if (!coupleId) return;
    const supabase = createClient();

    const fetchMovies = async () => {
      const { data } = await supabase
        .from("movies_list")
        .select("*")
        .eq("couple_id", coupleId)
        .order("created_at", { ascending: false });
      if (data) setMovies(data);
    };

    fetchMovies();

    const channel = supabase
      .channel(`movies:${coupleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "movies_list", filter: `couple_id=eq.${coupleId}` },
        fetchMovies
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleId]);

  return { movies };
}

export function useAddMovie() {
  const { coupleId, user } = useAuthStore();
  return async (title: string, type: "movie" | "show") => {
    if (!coupleId || !user) return;

    let poster_url = null;
    try {
      poster_url = await getPosterUrl(title, type);
    } catch (e) {
      console.error("Failed to fetch poster via server action", e);
    }

    const supabase = createClient();
    const { error } = await supabase.from("movies_list").insert({
      title,
      type,
      poster_url,
      couple_id: coupleId,
      added_by: user.id
    });

    if (error) {
      console.error("Failed to add movie to Supabase:", error);
    }
  };
}

export function useToggleMovieWatched() {
  return async (id: string, is_watched: boolean) => {
    const supabase = createClient();
    await supabase.from("movies_list").update({ is_watched }).eq("id", id);
  };
}

export function useDeleteMovie() {
  return async (id: string) => {
    const supabase = createClient();
    await supabase.from("movies_list").delete().eq("id", id);
  };
}

