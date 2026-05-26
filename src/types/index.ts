// Database types matching Supabase tables

export type User = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  couple_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Couple = {
  id: string;
  name: string | null;
  start_date: string;
  created_at: string;
};

export type MessageType =
  | "text"
  | "image"
  | "video"
  | "voice"
  | "gif"
  | "sticker"
  | "snap";

export type Message = {
  id: string;
  content: string | null;
  type: MessageType;
  media_url: string | null;
  reply_to_id: string | null;
  reply_to?: Message | null;
  is_pinned: boolean;
  sender_id: string;
  sender?: User;
  couple_id: string;
  reactions?: Reaction[];
  created_at: string;
  read_at: string | null;
};

export type Reaction = {
  id: string;
  emoji: string;
  message_id: string;
  user_id: string;
  created_at: string;
};

export type Memory = {
  id: string;
  title: string | null;
  description: string | null;
  media_url: string | null;
  date: string;
  couple_id: string;
  created_at: string;
};

export type SharedNote = {
  id: string;
  content: string;
  couple_id: string;
  created_at: string;
  updated_at: string;
};

export type MoodOption =
  | "happy"
  | "sleepy"
  | "studying"
  | "gaming"
  | "missing-you"
  | "busy"
  | "excited"
  | "relaxing"
  | "working"
  | "cooking"
  | "angry"
  | "sad"
  | "sick"
  | "turned_on"
  | "romantic"
  | "hurt";

export type MoodStatus = {
  id: string;
  mood: MoodOption;
  user_id: string;
  user?: User;
  created_at: string;
};

// App-level types

export type CalendarEventType = "exam" | "date" | "anniversary" | "trip" | "other";

export type CalendarEvent = {
  id: string;
  title: string;
  type: CalendarEventType;
  start_date: string;
  end_date: string;
  user_id: string;
  couple_id: string;
  created_at: string;
};

export type OnlineStatus = "online" | "offline" | "away";

export type PresenceState = {
  user_id: string;
  status: OnlineStatus;
  last_seen: string;
  is_typing: boolean;
};

export type CoupleSong = {
  id: string;
  title: string;
  artist: string;
  album_art_url: string | null;
  link_url: string | null;
  added_by: string;
  couple_id: string;
  is_featured: boolean;
  created_at: string;
};

export type Movie = {
  id: string;
  title: string;
  type: "movie" | "show";
  is_watched: boolean;
  poster_url?: string | null;
  added_by: string;
  couple_id: string;
  created_at: string;
};
