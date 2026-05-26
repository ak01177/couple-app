"use client";

import { useState, useRef, useCallback } from "react";

export function useCameraCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsTorchOn(false);
  };

  const startStream = async (mode: "user" | "environment") => {
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera.");
      return null;
    }
  };

  const openCamera = useCallback(async () => {
    setError(null);
    setCapturedBlob(null);
    setCapturedUrl(null);
    const stream = await startStream(facingMode);
    if (stream) {
      setIsOpen(true);
    }
  }, [facingMode]);

  const flipCamera = useCallback(async () => {
    const newMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newMode);
    await startStream(newMode);
  }, [facingMode]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      // TypeScript types for applyConstraints might not include torch, so we cast
      await track.applyConstraints({
        advanced: [{ torch: !isTorchOn } as any],
      });
      setIsTorchOn((prev) => !prev);
    } catch (err) {
      console.error("Torch error:", err);
      // Device might not support torch
    }
  }, [isTorchOn]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // If facing user, we might want to flip the canvas horizontally to match the mirror view
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedUrl(url);
        stopStream();
      },
      "image/jpeg",
      0.92
    );
  }, [facingMode]);

  const retake = useCallback(async () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null);
    setCapturedUrl(null);
    setError(null);
    await startStream(facingMode);
  }, [capturedUrl, facingMode]);

  const close = useCallback(() => {
    stopStream();
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null);
    setCapturedUrl(null);
    setError(null);
    setIsOpen(false);
  }, [capturedUrl]);

  const clearCapture = useCallback(() => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null);
    setCapturedUrl(null);
  }, [capturedUrl]);

  return {
    isOpen,
    capturedBlob,
    capturedUrl,
    error,
    streamRef,
    videoRef,
    canvasRef,
    facingMode,
    isTorchOn,
    openCamera,
    capture,
    retake,
    close,
    clearCapture,
    flipCamera,
    toggleTorch,
  };
}
