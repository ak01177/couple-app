import { createClient } from "@/lib/supabase/client";
import {
  useAuthStore,
  useChatStore,
  usePresenceStore,
  useCalendarStore,
} from "@/store";

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  useAuthStore.getState().reset();
  useChatStore.getState().reset();
  usePresenceStore.getState().reset();
  useCalendarStore.getState().reset();
}
