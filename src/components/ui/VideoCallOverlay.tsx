"use client";

import { useEffect, useRef } from "react";
import { useCallStore } from "@/store/useCallStore";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from "lucide-react";

export function VideoCallOverlay() {
  const { status, callType, localStream, remoteStream, isMuted, isVideoOff } = useCallStore();
  const { endCall, toggleMute, toggleVideo } = useWebRTC();
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (status !== 'connected' || callType !== 'video') return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black animate-fade-in flex flex-col">
      {/* Remote Video (Full Screen) */}
      <div className="flex-1 relative w-full h-full">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            Connecting...
          </div>
        )}
      </div>

      {/* Local Video (PiP Style floating top right) */}
      <div className="absolute safe-top right-4 mt-16 w-28 h-40 bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-10">
        {localStream ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-white/50">
            No Camera
          </div>
        )}
      </div>

      {/* Controls Bar (Bottom) */}
      <div className="absolute bottom-8 safe-bottom left-1/2 -translate-x-1/2 flex items-center gap-6 glass-strong px-8 py-4 rounded-full">
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={() => endCall()}
          className="w-14 h-14 rounded-full bg-error flex items-center justify-center text-white shadow-glow hover:scale-105 transition-transform"
        >
          <PhoneOff size={24} />
        </button>

        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isVideoOff ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
        </button>
      </div>
    </div>
  );
}
