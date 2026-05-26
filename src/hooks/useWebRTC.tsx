"use client";

import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store';
import { useCallStore, CallType } from '@/store/useCallStore';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

interface WebRTCContextType {
  startCall: (type?: CallType) => Promise<void>;
  answerCall: () => Promise<void>;
  endCall: (broadcast?: boolean) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
}

const WebRTCContext = createContext<WebRTCContextType | null>(null);

export function WebRTCProvider({ children }: { children: React.ReactNode }) {
  const coupleId = useAuthStore(s => s.coupleId);
  const user = useAuthStore(s => s.user);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const {
    setCallState,
    resetCall,
    localStream,
    callType,
    isScreenSharing
  } = useCallStore();

  const endCall = useCallback((broadcast = true) => {
    if (broadcast && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'end-call',
        payload: { senderId: user?.id }
      });
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    resetCall();
  }, [resetCall, user]);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(STUN_SERVERS);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: { candidate: event.candidate, senderId: user?.id }
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;

      const offer = useCallStore.getState().incomingCallOffer;
      if (offer && offer.screenStreamId === stream.id) {
        setCallState({ remoteScreenStream: stream });
      } else {
        setCallState({ remoteStream: stream });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        endCall(false);
      }
    };

    return pc;
  }, [setCallState, user, endCall]);

  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  const flushIceCandidates = async () => {
    if (!pcRef.current) return;
    while (iceCandidatesQueue.current.length > 0) {
      const candidate = iceCandidatesQueue.current.shift();
      if (candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error flushing ice candidate', e);
        }
      }
    }
  };

  useEffect(() => {
    if (!coupleId || !user) return;
    const supabase = createClient();

    const channel = supabase.channel(`webrtc:${coupleId}`);
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'call-offer' }, async ({ payload }) => {
        if (payload.senderId === user.id) return;
        setCallState({
          status: 'ringing',
          callType: payload.callType,
          incomingCallOffer: payload // Store entire payload so we have screenStreamId
        });
      })
      .on('broadcast', { event: 'call-answer' }, async ({ payload }) => {
        if (payload.senderId === user.id) return;
        if (pcRef.current && pcRef.current.signalingState !== 'stable') {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
          setCallState({ status: 'connected' });
          await flushIceCandidates();
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
        if (payload.senderId === user.id) return;
        if (pcRef.current) {
          if (pcRef.current.remoteDescription) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              console.error('Error adding received ice candidate', e);
            }
          } else {
            iceCandidatesQueue.current.push(payload.candidate);
          }
        }
      })
      .on('broadcast', { event: 'end-call' }, ({ payload }) => {
        if (payload.senderId === user.id) return;
        endCall(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      iceCandidatesQueue.current = [];
    };
  }, [coupleId, user, setCallState, endCall]);

  const startCall = async (type: CallType = 'video') => {
    setCallState({ status: 'ringing', callType: type });
    const pc = createPeerConnection();

    let cameraStream: MediaStream | null = null;
    let screenStream: MediaStream | null = null;
    let screenStreamId: string | undefined;

    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => pc.addTrack(track, cameraStream!));
      }

      if (type === 'movie_room') {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        if (screenStream) {
          screenStream.getTracks().forEach(track => pc.addTrack(track, screenStream!));
          screenStreamId = screenStream.id;
        }
      }

      setCallState({
        localStream: cameraStream,
        localScreenStream: screenStream,
        isScreenSharing: !!screenStream
      });

    } catch (error) {
      console.error("Error accessing media devices.", error);
      endCall(false);
      return;
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    channelRef.current?.send({
      type: 'broadcast',
      event: 'call-offer',
      payload: { offer, senderId: user?.id, callType: type, screenStreamId }
    });
  };

  const answerCall = async () => {
    const pc = createPeerConnection();
    const payload = useCallStore.getState().incomingCallOffer;

    if (!payload || !payload.offer) return;
    setCallState({ status: 'connected' }); // DO NOT clear incomingCallOffer yet! We need it for ontrack stream matching

    // Guests only share camera!
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCallState({ localStream: cameraStream });
      cameraStream.getTracks().forEach(track => pc.addTrack(track, cameraStream));
    } catch (e) {
      console.error("Guest camera failed", e);
    }

    await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
    await flushIceCandidates();
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    channelRef.current?.send({
      type: 'broadcast',
      event: 'call-answer',
      payload: { answer, senderId: user?.id }
    });
  };

  const toggleMute = () => {
    const stream = useCallStore.getState().localStream;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState({ isMuted: !audioTrack.enabled });
      }
    }
  };

  const toggleVideo = () => {
    const stream = useCallStore.getState().localStream;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState({ isVideoOff: !videoTrack.enabled });
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!pcRef.current) return;
    const stream = useCallStore.getState().localStream;
    if (!stream) return;

    try {
      if (isScreenSharing) {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const videoTrack = cameraStream.getVideoTracks()[0];
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(videoTrack);

        stream.getTracks().forEach(t => t.stop());
        setCallState({ localStream: cameraStream, isScreenSharing: false });
      } else {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);

        stream.getTracks().forEach(t => t.stop());
        setCallState({ localStream: screenStream, isScreenSharing: true });
      }
    } catch (e) {
      console.error("Failed to toggle screen share", e);
    }
  };

  return (
    <WebRTCContext.Provider value={{ startCall, answerCall, endCall, toggleMute, toggleVideo, toggleScreenShare }
    }>
      {children}
    </WebRTCContext.Provider>
  );
}

export function useWebRTC() {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
}
