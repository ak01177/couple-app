import { MoodOption } from "@/types";

export type MoodDefinition = {
  emoji: string;
  label: string;
};

export const MOODS: Record<MoodOption, MoodDefinition> = {
  "happy": { emoji: "😊", label: "Happy" },
  "sleepy": { emoji: "😴", label: "Sleepy" },
  "studying": { emoji: "📚", label: "Studying" },
  "gaming": { emoji: "🎮", label: "Gaming" },
  "missing-you": { emoji: "🥺", label: "Missing you" },
  "busy": { emoji: "🏃‍♂️", label: "Busy" },
  "excited": { emoji: "✨", label: "Excited" },
  "relaxing": { emoji: "🛀", label: "Relaxing" },
  "working": { emoji: "💻", label: "Working" },
  "cooking": { emoji: "🍳", label: "Cooking" },
  "angry": { emoji: "😠", label: "Angry" },
  "sad": { emoji: "😢", label: "Sad" },
  "sick": { emoji: "🤒", label: "Sick" },
  "turned_on": { emoji: "😍", label: "Turned on" },
  "romantic": { emoji: "❤️", label: "Romantic" },
  "hurt": { emoji: "💔", label: "Hurt" }

};
