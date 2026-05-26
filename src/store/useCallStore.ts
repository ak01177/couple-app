import { create } from "zustand";

export type CallType = "video" | "movie_room" | "none";
export type CallStatus = "idle" | "ringing" | "connected";

interface CallState {
  callType: CallType;
  status: CallStatus;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  localScreenStream: MediaStream | null;
  remoteScreenStream: MediaStream | null;
  incomingCallOffer: any | null; // The SDP offer from partner

  setCallState: (updates: Partial<CallState>) => void;
  resetCall: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  callType: "none",
  status: "idle",
  isMuted: false,
  isVideoOff: false,
  isScreenSharing: false,
  localStream: null,
  remoteStream: null,
  localScreenStream: null,
  remoteScreenStream: null,
  incomingCallOffer: null,

  setCallState: (updates) => set((state) => ({ ...state, ...updates })),
  
  resetCall: () => {
    set((state) => {
      // Clean up media tracks when resetting the call
      if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
      }
      if (state.localScreenStream) {
        state.localScreenStream.getTracks().forEach(track => track.stop());
      }
      return {
        callType: "none",
        status: "idle",
        isMuted: false,
        isVideoOff: false,
        isScreenSharing: false,
        localStream: null,
        remoteStream: null,
        localScreenStream: null,
        remoteScreenStream: null,
        incomingCallOffer: null,
      };
    });
  },
}));
