"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getPrivateMediaUrl } from "@/lib/storage";
import { useAuthStore } from "@/store";

export function AudioPlayer({ path }: { path: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const revokeRef = useRef<(() => void) | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { user, coupleId, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (authLoading || !user || !coupleId) return;

    let cancelled = false;

    async function loadAudio() {
      const supabase = createClient();
      const result = await getPrivateMediaUrl(supabase, path);

      if (cancelled) return;

      if (result.ok) {
        setAudioUrl(result.url);
        revokeRef.current = result.revoke ?? null;
      }
      setIsLoading(false);
    }

    loadAudio();

    return () => {
      cancelled = true;
      revokeRef.current?.();
    };
  }, [path, authLoading, user, coupleId]);

  useEffect(() => {
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const onAudioEnd = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", onAudioEnd);

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", onAudioEnd);
      audio.pause();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 w-48 sm:w-56 bg-bg-surface/30 rounded-xl p-2 h-12">
        <Loader2 size={16} className="animate-spin text-accent" />
        <span className="text-xs text-text-muted">Loading audio...</span>
      </div>
    );
  }

  if (!audioUrl) {
    return (
      <div className="flex items-center justify-center w-48 sm:w-56 bg-bg-surface/30 rounded-xl p-2 h-12">
        <span className="text-xs text-text-muted">Audio unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 w-48 sm:w-56 bg-black/20 rounded-xl p-2 shadow-inner">
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center shrink-0 hover:bg-accent-light transition-colors shadow-soft"
      >
        {isPlaying ? (
          <Pause size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="w-full h-1.5 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-text-muted">
            {formatTime(currentTime)}
          </span>
          <span className="text-[10px] text-text-muted">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
