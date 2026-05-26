"use client";

import { WebRTCProvider } from "@/hooks/useWebRTC";
import { IncomingCallModal } from "../ui/IncomingCallModal";
import { VideoCallOverlay } from "../ui/VideoCallOverlay";

export function CallProvider({ children }: { children: React.ReactNode }) {
  return (
    <WebRTCProvider>
      {children}
      <IncomingCallModal />
      <VideoCallOverlay />
    </WebRTCProvider>
  );
}
