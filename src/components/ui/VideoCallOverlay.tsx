"use client";

import { useEffect, useRef, useState } from "react";
import { useCallStore } from "@/store/useCallStore";
import { useAuthStore } from "@/store";
import { useWebRTC } from "@/hooks/useWebRTC";
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff,
  SwitchCamera,
  Zap,
  ZapOff
} from "lucide-react";
import { motion, useDragControls } from "framer-motion";
import Avatar from "./Avatar";

export function VideoCallOverlay() {
  const { 
    status, 
    callType, 
    localStream, 
    remoteStream, 
    isMuted, 
    isVideoOff,
    isTorchOn,
    remoteIsMuted,
    remoteIsVideoOff
  } = useCallStore();
  const { endCall, toggleMute, toggleVideo, flipCamera, toggleTorch } = useWebRTC();
  const partner = useAuthStore(s => s.partner);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-black animate-fade-in flex flex-col overflow-hidden">
      
      {/* Remote Video (Full Screen) */}
      <div className="flex-1 relative w-full h-full">
        {remoteIsVideoOff ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-bg-deep">
            <Avatar 
              src={partner?.avatar_url} 
              alt={partner?.display_name || "Partner"} 
              size="xl" 
              className="mb-4 scale-150 shadow-2xl" 
            />
            <div className="flex items-center gap-2 text-white/50 bg-black/30 px-4 py-1.5 rounded-full mt-8">
              <VideoOff size={16} />
              <span className="text-sm font-medium">Camera Off</span>
            </div>
          </div>
        ) : remoteStream ? (
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
        
        {/* Remote Mute Indicator */}
        {remoteIsMuted && (
          <div className="absolute top-safe right-4 mt-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full flex items-center gap-2 text-white/80 border border-white/10">
            <MicOff size={16} />
            <span className="text-xs font-medium">Muted</span>
          </div>
        )}
      </div>

      {/* Local Video (Draggable PiP) */}
      <motion.div 
        drag
        dragConstraints={containerRef}
        dragElastic={0.1}
        dragMomentum={false}
        className="absolute z-20 w-32 h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-zinc-900 cursor-grab active:cursor-grabbing touch-none"
        initial={{ top: "env(safe-area-inset-top, 24px)", right: 16 }}
      >
        {isVideoOff ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/80">
            <VideoOff size={24} className="text-white/50" />
          </div>
        ) : localStream ? (
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

        {/* Local Camera Controls inside PiP */}
        {!isVideoOff && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-2 px-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleTorch(); }}
              className={`p-1.5 rounded-full bg-black/50 backdrop-blur border border-white/10 transition-colors ${
                isTorchOn ? 'text-yellow-400 bg-white/20' : 'text-white'
              }`}
            >
              {isTorchOn ? <Zap size={14} /> : <ZapOff size={14} />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); flipCamera(); }}
              className="p-1.5 rounded-full bg-black/50 backdrop-blur text-white border border-white/10 active:scale-95 transition-transform"
            >
              <SwitchCamera size={14} />
            </button>
          </div>
        )}
      </motion.div>

      {/* Controls Bar (Bottom) */}
      <div className="absolute bottom-safe left-1/2 -translate-x-1/2 mb-8 flex items-center gap-6 glass-strong px-8 py-4 rounded-full border border-white/10 z-30">
        <button
          onClick={toggleMute}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-white text-black shadow-glow' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          onClick={() => endCall()}
          className="w-14 h-14 rounded-full bg-error flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 transition-transform"
        >
          <PhoneOff size={24} />
        </button>

        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isVideoOff ? 'bg-white text-black shadow-glow' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
        </button>
      </div>
    </div>
  );
}
