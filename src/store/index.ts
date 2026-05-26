import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Message, MoodStatus, PresenceState, CalendarEvent } from "@/types";

// === Auth Store ===

interface AuthState {
  user: User | null;
  partner: User | null;
  coupleId: string | null;
  couple: { id: string; name: string; start_date: string } | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setPartner: (partner: User | null) => void;
  setCoupleId: (id: string | null) => void;
  setCouple: (couple: { id: string; name: string; start_date: string } | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  partner: null,
  coupleId: null,
  couple: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setPartner: (partner) => set({ partner }),
  setCoupleId: (coupleId) => set({ coupleId }),
  setCouple: (couple) => set({ couple }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () =>
    set({ user: null, partner: null, coupleId: null, couple: null, isLoading: false }),
}));

// === Chat Store ===

interface ChatState {
  messages: Message[];
  isLoadingMessages: boolean;
  hasMore: boolean;
  replyingTo: Message | null;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  prependMessages: (messages: Message[]) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  removeMessage: (id: string) => void;
  setLoadingMessages: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setReplyingTo: (message: Message | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoadingMessages: true,
  hasMore: true,
  replyingTo: null,
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  prependMessages: (newMessages) =>
    set((state) => ({
      messages: [...newMessages, ...state.messages],
    })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    })),
  setLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),
  setHasMore: (hasMore) => set({ hasMore }),
  setReplyingTo: (replyingTo) => set({ replyingTo }),
  reset: () =>
    set({
      messages: [],
      isLoadingMessages: true,
      hasMore: true,
      replyingTo: null,
    }),
}));

// === Presence Store ===

interface PresenceStore {
  partnerPresence: PresenceState | null;
  partnerMood: MoodStatus | null;
  myMood: MoodStatus | null;
  sharedNote: string;
  setPartnerPresence: (presence: PresenceState | null) => void;
  setPartnerMood: (mood: MoodStatus | null) => void;
  setMyMood: (mood: MoodStatus | null) => void;
  setSharedNote: (note: string) => void;
  reset: () => void;
}

export const usePresenceStore = create<PresenceStore>((set) => ({
  partnerPresence: null,
  partnerMood: null,
  myMood: null,
  sharedNote: "",
  setPartnerPresence: (partnerPresence) => set({ partnerPresence }),
  setPartnerMood: (partnerMood) => set({ partnerMood }),
  setMyMood: (myMood) => set({ myMood }),
  setSharedNote: (sharedNote) => set({ sharedNote }),
  reset: () =>
    set({
      partnerPresence: null,
      partnerMood: null,
      myMood: null,
      sharedNote: "",
    }),
}));

// === Calendar Store ===

interface CalendarState {
  events: CalendarEvent[];
  isLoading: boolean;
  setEvents: (events: CalendarEvent[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  events: [],
  isLoading: true,
  setEvents: (events) => set({ events }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ events: [], isLoading: true }),
}));

// === UI Store ===

interface UIState {
  activeTab: "home" | "chat" | "memories" | "settings";
  isSplashDone: boolean;
  showReactionPicker: string | null; // message ID
  setActiveTab: (tab: UIState["activeTab"]) => void;
  setSplashDone: (done: boolean) => void;
  setShowReactionPicker: (messageId: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeTab: "home",
      isSplashDone: false,
      showReactionPicker: null,
      setActiveTab: (activeTab) => set({ activeTab }),
      setSplashDone: (isSplashDone) => set({ isSplashDone }),
      setShowReactionPicker: (showReactionPicker) => set({ showReactionPicker }),
    }),
    {
      name: "couple-app-ui",
      partialize: (state) => ({ isSplashDone: state.isSplashDone }), // Only persist splash
    }
  )
);
