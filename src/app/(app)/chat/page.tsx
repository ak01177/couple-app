"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Image as ImageIcon,
  Smile,
  Reply,
  X,
  Check,
  CheckCheck,
  ArrowDown,
  Mic,
  Trash2,
  StopCircle,
  Camera,
  Pin,
  PinOff,
  Video as VideoIcon,
} from "lucide-react";
import { Avatar, ChatSkeleton } from "@/components/ui";
import type { Message } from "@/types";
import { useAuthStore, useChatStore, usePresenceStore } from "@/store";
import {
  useMessages,
  useSendMessage,
  useReactions,
  usePresence,
  useUploadMedia,
  useMood,
  useMarkMessagesRead,
  useEditMessage,
} from "@/hooks/useSupabase";
import { PrivateImage } from "@/components/ui/PrivateImage";
import { SnapViewer } from "@/components/ui/SnapViewer";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useCameraCapture } from "@/hooks/useCameraCapture";
import { compressImage } from "@/lib/imageCompression";
import { MOODS } from "@/config/moods";
import { MoodPicker } from "@/components/ui/MoodPicker";
import { useWebRTC } from "@/hooks/useWebRTC";

// Removed DEMO_MESSAGES

// ============ SEND MESSAGE ============

function formatMessageTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(dateStr: string) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function shouldShowDateSeparator(messages: Message[], index: number) {
  if (index === 0) return true;
  const curr = new Date(messages[index].created_at).toDateString();
  const prev = new Date(messages[index - 1].created_at).toDateString();
  return curr !== prev;
}

function isConsecutive(messages: Message[], index: number) {
  if (index === 0) return false;
  const prev = messages[index - 1];
  const curr = messages[index];
  if (prev.sender_id !== curr.sender_id) return false;
  const diff =
    new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
  return diff < 120000; // 2 minutes
}

// ============ REACTION PICKER ============

const quickReactions = ["❤️", "😂", "😮", "😢", "🔥", "👍"];

function ReactionPicker({
  onReact,
  onClose,
}: {
  onReact: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 8 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 bg-bg-elevated border border-border rounded-full px-2 py-1.5 flex items-center gap-1 shadow-glow"
    >
      {quickReactions.map((emoji) => (
        <motion.button
          key={emoji}
          whileTap={{ scale: 0.8 }}
          whileHover={{ scale: 1.2 }}
          onClick={() => {
            onReact(emoji);
            onClose();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-hover transition-colors text-lg"
        >
          {emoji}
        </motion.button>
      ))}
    </motion.div>
  );
}

// ============ TYPING INDICATOR ============

function TypingIndicator({ partnerName = "Partner" }: { partnerName?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex items-center gap-2 px-5 py-1"
    >
      <Avatar alt={partnerName} size="sm" />
      <div className="bg-bg-surface border border-border/60 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-text-muted"
            animate={{
              opacity: [0.3, 1, 0.3],
              y: [0, -4, 0],
            }}
            transition={{
              duration: 1,
              delay: i * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ============ MESSAGE BUBBLE ============

function getReplyPreviewText(msg: Message | undefined | null) {
  if (!msg) return "Loading...";
  if (msg.content) return msg.content;
  if (msg.type === "image") return "📷 Photo";
  if (msg.type === "voice") return "🎤 Voice Message";
  if (msg.type === "snap") return "👻 Snap";
  return "Attachment";
}

const MessageBubble = memo(function MessageBubble({
  message,
  isMe,
  isGrouped,
  onReply,
  onReact,
  partnerName,
  repliedMessage,
  onPin,
}: {
  message: Message;
  isMe: boolean;
  isGrouped: boolean;
  onReply: (msg: Message) => void;
  onReact: (msgId: string, emoji: string) => void;
  partnerName?: string;
  repliedMessage?: Message | null;
  onPin: (msg: Message) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);
  const [dragX, setDragX] = useState(0);
  const SWIPE_THRESHOLD = 60;

  return (
    <motion.div
      layout
      initial={isMe ? { opacity: 0, x: 16 } : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={`flex ${isMe ? "justify-end" : "justify-start"} ${isGrouped ? "mt-0.5" : "mt-3"} px-4 group relative`}
    >
      {/* Swipe-to-reply drag container */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: SWIPE_THRESHOLD }}
        dragElastic={0.2}
        onDrag={(_, info) => setDragX(info.offset.x)}
        onDragEnd={(_, info) => {
          if (info.offset.x >= SWIPE_THRESHOLD - 10) {
            onReply(message);
          }
          setDragX(0);
        }}
        animate={{ x: 0 }}
        className={`flex w-full ${isMe ? "justify-end" : "justify-start"} items-center relative`}
        style={{ touchAction: "pan-y" }}
      >
        {/* Reply hint icon — appears as you swipe */}
        <motion.div
          className={`absolute ${isMe ? "left-0" : "left-0"} flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 border border-accent/30`}
          animate={{ opacity: Math.min(dragX / SWIPE_THRESHOLD, 1), scale: Math.min(0.6 + (dragX / SWIPE_THRESHOLD) * 0.4, 1) }}
          style={{ pointerEvents: "none" }}
        >
          <Reply size={14} className="text-accent" />
        </motion.div>
      {/* Partner avatar (only on first of group) */}
      {!isMe && !isGrouped && (
        <div className="mr-2 self-end mb-0.5">
          <Avatar alt={partnerName || "Partner"} size="sm" />
        </div>
      )}
      {!isMe && isGrouped && <div className="w-8 mr-2 shrink-0" />}

      <div className={`max-w-[78%] relative ${isMe ? "items-end" : "items-start"}`}>
        {/* Reply preview */}
        {message.reply_to_id && (
          <div
            className={`mb-1 px-3 py-1.5 rounded-xl text-xs ${isMe
              ? "bg-accent-muted/50 border-l-2 border-accent ml-auto"
              : "bg-bg-elevated border-l-2 border-pink"
              }`}
          >
            <p className="text-text-muted truncate">
              {repliedMessage
                ? getReplyPreviewText(repliedMessage)
                : "Replied message (Loading...)"}
            </p>
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative px-3.5 py-2 ${isMe
            ? "bubble-sent bg-gradient-to-br from-accent to-accent-dark text-white"
            : "bubble-received bg-bg-surface border border-border/60 text-text-primary"
            }`}
          onDoubleClick={() => setShowReactions(!showReactions)}
        >
          {/* Reaction Picker */}
          <AnimatePresence>
            {showReactions && (
              <ReactionPicker
                onReact={(emoji) => onReact(message.id, emoji)}
                onClose={() => setShowReactions(false)}
              />
            )}
          </AnimatePresence>

          {/* Content */}
          {message.type === "snap" && (
            <SnapViewer message={message} isMe={isMe} />
          )}
          {message.type === "image" && message.media_url && (
            <PrivateImage path={message.media_url} />
          )}
          {message.type === "voice" && message.media_url && (
            <div className="mb-1 mt-1">
              <AudioPlayer path={message.media_url} />
            </div>
          )}
          {message.content && message.type !== "snap" && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Time + Read receipt */}
          <div
            className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"
              }`}
          >
            <span
              className={`text-[10px] ${isMe ? "text-white/60" : "text-text-muted"
                }`}
            >
              {formatMessageTime(message.created_at)}
            </span>
            {isMe && (
              <span className="text-white/60">
                {message.read_at ? (
                  <CheckCheck size={12} />
                ) : (
                  <Check size={12} />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reactions display */}
        {message.reactions && message.reactions.length > 0 && (() => {
          const grouped = message.reactions.reduce((acc, curr) => {
            acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          return (
            <div
              className={`flex gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {Object.entries(grouped).map(([emoji, count]) => (
                <motion.button
                  key={emoji}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onReact(message.id, emoji)}
                  className="flex items-center gap-1 text-xs bg-bg-elevated border border-border/40 rounded-full px-2 py-0.5 hover:bg-bg-hover transition-colors"
                >
                  <span>{emoji}</span>
                  {count > 1 && <span className="text-text-muted font-medium">{count}</span>}
                </motion.button>
              ))}
            </div>
          );
        })()}

        {/* Reply button (on hover / desktop) */}
        <button
          onClick={() => onReply(message)}
          className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-bg-elevated border border-border/40 text-text-muted hover:text-text-secondary ${isMe ? "-left-10" : "-right-10"}`}
        >
          <Reply size={14} />
        </button>
        {/* Pin button (on hover / desktop) */}
        <button
          onClick={() => onPin(message)}
          className={`absolute top-1/2 translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-bg-elevated border border-border/40 text-text-muted hover:text-text-secondary ${isMe ? "-left-10" : "-right-10"}`}
        >
          {message.is_pinned ? <PinOff size={12} /> : <Pin size={12} />}
        </button>
      </div>
      </motion.div>
    </motion.div>
  );
});

MessageBubble.displayName = "MessageBubble";

// ============ MAIN CHAT PAGE ============

export default function ChatPage() {
  const { user, partner, coupleId } = useAuthStore();

  // Real-time messages hook from Supabase
  const messages = useChatStore((s) => s.messages);
  const isLoadingMessages = useChatStore((s) => s.isLoadingMessages);
  const hasMore = useChatStore((s) => s.hasMore);
  const { loadMore } = useMessages(coupleId);
  useMarkMessagesRead(coupleId);
  const sendMsg = useSendMessage();
  const { toggleReaction } = useReactions();
  const { setTyping } = usePresence(coupleId);
  useMood();
  const uploadMedia = useUploadMedia();
  const camera = useCameraCapture();
  const editMessage = useEditMessage();

  const partnerPresence = usePresenceStore((s) => s.partnerPresence);
  const partnerMood = usePresenceStore((s) => s.partnerMood);
  const isPartnerTyping = partnerPresence?.is_typing || false;
  const isPartnerOnline = partnerPresence?.status === "online";

  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPinned, setShowPinned] = useState(false);
  const { startCall } = useWebRTC();

  // ============ NEW: VOICE NOTES ============
  const {
    isRecording,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    cancelRecording,
    clearAudio
  } = useAudioRecorder();

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const voiceSendingRef = useRef(false);

  const sendVoiceNote = useCallback(
    async (blob: Blob) => {
      if (!coupleId || !user || voiceSendingRef.current) return;
      voiceSendingRef.current = true;
      setIsUploading(true);

      try {
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        const mediaUrl = await uploadMedia(file, "voice-notes");

        if (mediaUrl) {
          await sendMsg("", replyingTo?.id, "voice", mediaUrl);
          setReplyingTo(null);
        }
      } finally {
        clearAudio();
        setIsUploading(false);
        voiceSendingRef.current = false;
      }
    },
    [coupleId, user, uploadMedia, sendMsg, replyingTo, clearAudio]
  );

  useEffect(() => {
    if (audioBlob) {
      sendVoiceNote(audioBlob);
    }
  }, [audioBlob, sendVoiceNote]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length, scrollToBottom]);

  // Send camera-captured photo
  const sendCameraPhoto = useCallback(async () => {
    if (!camera.capturedBlob) return;
    const blob = camera.capturedBlob;
    camera.close();
    setIsUploading(true);
    try {
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
      const compressed = await compressImage(file);
      const url = await uploadMedia(compressed, "chat");
      if (url) {
        await sendMsg("", replyingTo?.id, "snap", url);
        setReplyingTo(null);
      }
    } finally {
      setIsUploading(false);
    }
  }, [camera, uploadMedia, sendMsg, replyingTo]);

  // Open camera and attach stream to video element
  const handleOpenCamera = useCallback(async () => {
    await camera.openCamera();
  }, [camera]);

  // Attach stream to video when camera opens
  // We use a callback ref approach via useEffect in the JSX

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 100);
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text && !selectedFile) return;

    const currentFile = selectedFile;
    const currentText = text;
    const currentReplyId = replyingTo?.id; // Capture this before resetting!

    setInputText("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setReplyingTo(null);

    if (currentFile) {
      setIsUploading(true);
      try {
        const compressed = await compressImage(currentFile);
        const url = await uploadMedia(compressed, "chat");
        if (url) {
          await sendMsg(currentText, currentReplyId, "snap", url);
        }
      } finally {
        setIsUploading(false);
      }
    } else {
      await sendMsg(currentText, currentReplyId);
    }

    setTimeout(() => scrollToBottom(), 50);
  }, [inputText, selectedFile, replyingTo, sendMsg, uploadMedia, scrollToBottom]);

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const typingStopRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = useCallback(() => {
    setTyping(true);
    if (typingStopRef.current) clearTimeout(typingStopRef.current);
    typingStopRef.current = setTimeout(() => setTyping(false), 2000);
  }, [setTyping]);

  // Handle file select for preview
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  // Add reaction via Supabase
  const handleReact = useCallback((messageId: string, emoji: string) => {
    toggleReaction(messageId, emoji);
  }, [toggleReaction]);

  // Pin / unpin message
  const handlePin = useCallback((message: Message) => {
    editMessage(message.id, { is_pinned: !message.is_pinned });
  }, [editMessage]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const container = messagesContainerRef.current;
    const prevHeight = container?.scrollHeight ?? 0;
    await loadMore();
    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = container.scrollHeight - prevHeight;
      }
      setLoadingMore(false);
    });
  }, [loadMore, hasMore, loadingMore]);

  // Attach camera stream to video element when it becomes available
  useEffect(() => {
    if (camera.isOpen && camera.videoRef.current && camera.streamRef.current && !camera.capturedUrl) {
      camera.videoRef.current.srcObject = camera.streamRef.current;
    }
  }, [camera.isOpen, camera.capturedUrl, camera]);

  return (
    <>
    {/* ── In-app Camera Viewfinder ── */}
    <AnimatePresence>
      {camera.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={camera.close}
            className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/50 text-white"
          >
            <X size={22} />
          </button>

          {/* Video / Preview */}
          <div className="flex-1 relative overflow-hidden">
            {camera.capturedUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={camera.capturedUrl}
                alt="Captured"
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                ref={camera.videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Hidden canvas for capture */}
          <canvas ref={camera.canvasRef} className="hidden" />

          {/* Error message */}
          {camera.error && (
            <div className="absolute top-16 inset-x-0 flex justify-center">
              <span className="bg-red-600/80 text-white text-sm px-4 py-2 rounded-full">
                {camera.error}
              </span>
            </div>
          )}

          {/* Controls */}
          <div className="shrink-0 pb-10 pt-6 flex items-center justify-center gap-10 bg-black">
            {camera.capturedUrl ? (
              <>
                {/* Retake */}
                <button
                  onClick={camera.retake}
                  className="flex flex-col items-center gap-1 text-white/70 hover:text-white transition-colors"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center">
                    <Camera size={22} />
                  </div>
                  <span className="text-xs">Retake</span>
                </button>

                {/* Send */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={sendCameraPhoto}
                  disabled={isUploading}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-glow">
                    {isUploading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={24} className="text-white" />
                    )}
                  </div>
                  <span className="text-xs text-white">Send</span>
                </motion.button>
              </>
            ) : (
              /* Shutter button */
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={camera.capture}
                className="w-20 h-20 rounded-full bg-white border-4 border-white/40 shadow-lg"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    <div className="h-full flex flex-col bg-bg-deep">
      {/* Chat Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-50 shrink-0 px-4 py-3 bg-bg-base/80 backdrop-blur-xl border-b border-border/50 flex items-center gap-3 safe-top"
      >
        <Avatar alt={partner?.display_name || "Partner"} size="md" status={isPartnerOnline ? "online" : "offline"} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-semibold text-text-primary">{partner?.display_name || "Partner"}</h1>
            {partnerMood && (
              <span className="text-sm flex items-center gap-1" title={`Feeling ${MOODS[partnerMood.mood]?.label}`}>
                {MOODS[partnerMood.mood]?.emoji}
                <span className="text-xs text-text-muted">({MOODS[partnerMood.mood]?.label})</span>
              </span>
            )}
          </div>
          <AnimatePresence mode="wait">
            {isPartnerTyping ? (
              <motion.p
                key="typing"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs text-accent"
              >
                typing...
              </motion.p>
            ) : (
              <motion.p
                key="online"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={`text-xs ${isPartnerOnline ? "text-success" : "text-text-muted"}`}
              >
                {isPartnerOnline ? "Online" : "Offline"}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* My Mood Picker */}
        <MoodPicker />

        {/* Video Call Button */}
        <button
          onClick={() => startCall('video')}
          className="p-2 rounded-xl text-accent hover:bg-accent/10 transition-colors shadow-soft"
          title="Start Video Call"
        >
          <VideoIcon size={18} />
        </button>

        {/* Pin panel toggle */}
        <button
          onClick={() => setShowPinned(p => !p)}
          className={`p-2 rounded-xl transition-colors ${showPinned ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-secondary hover:bg-bg-elevated'}`}
          title="Pinned messages"
        >
          <Pin size={18} />
        </button>
      </motion.header>

      {/* Pinned Messages Panel */}
      <AnimatePresence>
        {showPinned && (() => {
          const pinned = messages.filter(m => m.is_pinned);
          return (
            <motion.div
              key="pinned-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="shrink-0 border-b border-border/40 bg-bg-surface/80 backdrop-blur-md overflow-hidden"
            >
              <div className="px-4 py-2">
                <p className="text-[10px] font-bold tracking-widest text-text-muted uppercase mb-2 flex items-center gap-1.5">
                  <Pin size={10} /> Pinned Messages
                </p>
                {pinned.length === 0 ? (
                  <p className="text-xs text-text-muted pb-1">No pinned messages yet. Hover a message and tap 📌</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {pinned.map(m => (
                      <div key={m.id} className="flex items-start gap-2 bg-bg-elevated rounded-xl px-3 py-2">
                        <Pin size={10} className="text-accent mt-1 shrink-0" />
                        <p className="text-xs text-text-primary truncate flex-1">{getReplyPreviewText(m)}</p>
                        <button
                          onClick={() => editMessage(m.id, { is_pinned: false })}
                          className="text-text-muted hover:text-text-primary shrink-0"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-3 relative scroll-smooth chat-scroll"
      >
        <div className="fixed top-[52px] left-0 right-0 h-8 bg-gradient-to-b from-bg-deep to-transparent z-10 pointer-events-none" />

        {hasMore && messages.length > 0 && (
          <div className="flex justify-center px-4 pb-2">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-xs font-medium text-accent hover:text-accent-light disabled:opacity-50 px-3 py-1.5 rounded-full bg-bg-surface border border-border/50"
            >
              {loadingMore ? "Loading..." : "Load earlier messages"}
            </button>
          </div>
        )}

        {isLoadingMessages && messages.length === 0 ? (
          <ChatSkeleton />
        ) : (
        messages.map((message, index) => (
          <div key={message.id}>
            {/* Date separator */}
            {shouldShowDateSeparator(messages, index) && (
              <div className="flex items-center justify-center my-4 px-4">
                <div className="bg-bg-surface/80 border border-border/40 rounded-full px-3 py-1">
                  <span className="text-[11px] text-text-muted font-medium">
                    {formatDateSeparator(message.created_at)}
                  </span>
                </div>
              </div>
            )}

            {/* Message bubble */}
            <MessageBubble
              message={message}
              isMe={user ? message.sender_id === user.id : false}
              isGrouped={isConsecutive(messages, index)}
              onReply={setReplyingTo}
              onReact={handleReact}
              onPin={handlePin}
              partnerName={partner?.display_name || "Partner"}
              repliedMessage={message.reply_to_id ? messages.find(m => m.id === message.reply_to_id) : null}
            />
          </div>
        ))
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {isPartnerTyping && <TypingIndicator partnerName={partner?.display_name || "Partner"} />}
        </AnimatePresence>

        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Scroll down button */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-28 right-4 z-20 w-10 h-10 rounded-full bg-bg-elevated border border-border shadow-soft flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowDown size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="shrink-0 px-4 py-2 bg-bg-surface/80 border-t border-border/40 flex items-center gap-3"
          >
            <div className="w-0.5 h-8 rounded-full bg-accent" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-accent font-medium">
                Replying to{" "}
                {user && replyingTo.sender_id === user.id ? "yourself" : partner?.display_name || "Partner"}
              </p>
              <p className="text-xs text-text-muted truncate">
                {getReplyPreviewText(replyingTo)}
              </p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 rounded-full text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Preview */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="shrink-0 px-4 py-2 bg-bg-surface/80 border-t border-border/40 flex items-center gap-3 relative"
          >
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">
                {selectedFile?.name}
              </p>
              <p className="text-[10px] text-text-muted mt-0.5">
                {(selectedFile?.size || 0) / 1024 < 1024
                  ? `${Math.round((selectedFile?.size || 0) / 1024)} KB`
                  : `${((selectedFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB`}
              </p>
            </div>
            <button
              onClick={cancelUpload}
              className="p-1.5 rounded-full bg-bg-elevated text-text-muted hover:text-text-primary transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="shrink-0 bg-bg-base/80 backdrop-blur-xl border-t border-border/50 px-3 py-2 safe-bottom">
        <div className="flex items-end gap-2 max-w-lg mx-auto relative">

          {/* Uploading overlay */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 bg-bg-base/60 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-accent/20"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-accent font-medium tracking-wide">Uploading...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`p-2.5 rounded-xl text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors shrink-0 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Attach Photo"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <ImageIcon size={20} />
          </button>

          {/* Camera button */}
          <button
            onClick={handleOpenCamera}
            disabled={isUploading}
            className={`p-2.5 rounded-xl text-text-muted hover:text-text-secondary hover:bg-bg-elevated transition-colors shrink-0 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Take Photo"
          >
            <Camera size={20} />
          </button>

          {/* Input Area or Recording UI */}
          {isRecording ? (
            <div className="flex-1 bg-bg-surface border border-border/60 rounded-2xl flex items-center justify-between px-4 py-2 transition-colors">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-3 h-3 bg-red-500 rounded-full"
                />
                <span className="text-sm font-medium text-text-primary tabular-nums">
                  {formatDuration(duration)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelRecording}
                  className="p-2 text-text-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={stopRecording}
                  className="p-2 text-accent hover:text-accent-light transition-colors"
                >
                  <StopCircle size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-bg-surface border border-border/60 rounded-2xl flex items-end overflow-hidden transition-colors focus-within:border-accent/50">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  handleTyping();
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                rows={1}
                className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted px-4 py-2.5 resize-none outline-none max-h-[120px]"
                style={{ minHeight: "40px" }}
              />
              <button className="p-2.5 text-text-muted hover:text-text-secondary transition-colors shrink-0">
                <Smile size={18} />
              </button>
            </div>
          )}

          {/* Send or Mic button */}
          {(inputText.trim() || selectedFile) ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              disabled={isUploading}
              className="p-2.5 rounded-xl transition-all shrink-0 gradient-bg text-white shadow-glow"
            >
              <Send size={20} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isUploading}
              className={`p-2.5 rounded-xl transition-all shrink-0 ${isRecording
                ? "bg-red-500/20 text-red-500 border border-red-500/40 shadow-soft"
                : "bg-bg-elevated text-text-muted hover:text-text-primary"
                }`}
            >
              <Mic size={20} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
