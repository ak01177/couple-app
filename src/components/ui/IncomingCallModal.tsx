"use client";

import { useCallStore } from "@/store/useCallStore";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Phone, Video, X } from "lucide-react";

export function IncomingCallModal() {
  const { status, incomingCallOffer, callType } = useCallStore();
  const { answerCall, endCall } = useWebRTC();

  if (status !== 'ringing' || !incomingCallOffer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-strong rounded-3xl p-8 flex flex-col items-center gap-6 animate-scale-in text-center max-w-sm w-[90%] shadow-glow">
        <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center animate-pulse-soft">
          {callType === 'movie_room' ? (
            <Video className="w-10 h-10 text-accent" />
          ) : (
            <Phone className="w-10 h-10 text-accent" />
          )}
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-2">Incoming Call...</h2>
          <p className="text-text-muted">
            {callType === 'movie_room' ? 'Movie Night Invite!' : 'Video Call'}
          </p>
        </div>

        <div className="flex gap-6 mt-4">
          <button
            onClick={() => endCall()}
            className="w-16 h-16 rounded-full bg-error/20 text-error flex items-center justify-center hover:bg-error hover:text-white transition-colors shadow-soft"
          >
            <X size={28} />
          </button>
          
          <button
            onClick={() => answerCall()}
            className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center hover:bg-success hover:text-white transition-colors animate-heart-beat shadow-soft"
          >
            <Phone size={28} className="fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
