"use client";

import { useState, useRef, useCallback } from "react";

export function useCameraCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const openCamera = useCallback(async () => {
    setError(null);
    setCapturedBlob(null);
    setCapturedUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // back camera on mobile
        audio: false,
      });
      streamRef.current = stream;
      setIsOpen(true);

      // Attach to video element once available (set via ref callback in UI)
      // We expose streamRef so the UI can attach it
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera. Please check permissions.");
    }
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedUrl(url);

        // Stop the stream
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      },
      "image/jpeg",
      0.92
    );
  }, []);

  const retake = useCallback(async () => {
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedBlob(null);
    setCapturedUrl(null);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Could not access camera.");
    }
  }, [capturedUrl]);

  const close = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
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
    openCamera,
    capture,
    retake,
    close,
    clearCapture,
  };
}
