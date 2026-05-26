"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { usePresenceStore, useAuthStore } from "@/store";
import { useEffect, useRef } from "react";
import { getPublicUrl } from "@/lib/storage";

// ─── Full-body character (same visual system as CharacterAvatar) ────────────

interface PuppetBodyProps {
  avatarSrc?: string | null;
  avatarAlt: string;
  isTyping: boolean;
  bodyControls: ReturnType<typeof useAnimation>;
  dotColor: string;
  shirtColor: string;
  pantsColor: string;
  skinColor: string;
  headSize: number;
}

function WaveHand({ visible }: { visible: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8, y: 6, rotate: 0 }}
      animate={
        visible
          ? {
            opacity: [0, 1, 1, 1, 0],
            x: 12,
            y: 4,
            rotate: [0, 28, -12, 28, 0],
          }
          : { opacity: 0 }
      }
      transition={{ duration: 1.8, delay: 0.3, ease: "easeInOut" }}
      style={{
        position: "absolute",
        right: -14,
        top: "30%",
        fontSize: 16,
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      👋
    </motion.div>
  );
}

function PuppetCharacter({
  avatarSrc,
  avatarAlt,
  isTyping,
  bodyControls,
  dotColor,
  shirtColor,
  pantsColor,
  skinColor,
  headSize,
}: PuppetBodyProps) {
  const resolvedSrc =
    avatarSrc && !avatarSrc.startsWith("http")
      ? getPublicUrl(avatarSrc)
      : avatarSrc;

  const initials = avatarAlt
    ? avatarAlt
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "?";

  const bodyW = headSize * 0.72;
  const bodyH = headSize * 0.8;
  const legH = headSize * 0.65;
  const legW = bodyW * 0.28;
  const armH = headSize * 0.65;
  const armW = headSize * 0.17;
  const totalW = bodyW + armW * 2 + 8;

  // Arm wave loop
  const leftArmVariants = {
    wave: {
      rotate: [-8, -30, -8],
      transition: { repeat: Infinity, duration: 2.4, ease: "easeInOut" as const },
    },
  };
  const rightArmVariants = {
    wave: {
      rotate: [8, 28, 8],
      transition: { repeat: Infinity, duration: 2.7, ease: "easeInOut" as const },
    },
  };

  return (
    <motion.div
      animate={bodyControls}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: totalW,
        transformOrigin: "50% 100%",
        position: "relative",
      }}
    >
      {/* Typing cloud */}
      <AnimatePresence>
        {isTyping && (
          <motion.div
            key="cloud"
            initial={{ opacity: 0, scale: 0.6, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 6 }}
            transition={{ type: "spring", stiffness: 600, damping: 28, mass: 0.5 }}
            style={{
              position: "absolute",
              top: -44,
              right: -4,
              zIndex: 10,
              background: "var(--color-bg-elevated, #1e1b2e)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 14,
              padding: "6px 10px",
              display: "flex",
              alignItems: "center",
              gap: 4,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            {/* cloud tail */}
            <div
              style={{
                position: "absolute",
                bottom: -5,
                left: 8,
                width: 8,
                height: 8,
                background: "var(--color-bg-elevated, #1e1b2e)",
                borderRight: "1px solid rgba(255,255,255,0.12)",
                borderBottom: "1px solid rgba(255,255,255,0.12)",
                transform: "rotate(45deg)",
              }}
            />
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                className={`rounded-full ${dotColor}`}
                style={{ width: 6, height: 6 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEAD */}
      <div style={{ position: "relative", width: headSize, height: headSize, flexShrink: 0 }}>
        {resolvedSrc ? (
          <img
            src={resolvedSrc}
            alt={avatarAlt}
            style={{
              width: headSize,
              height: headSize,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2.5px solid rgba(255,255,255,0.3)",
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: headSize,
              height: headSize,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: headSize * 0.3,
              border: "2.5px solid rgba(255,255,255,0.25)",
            }}
          >
            {initials}
          </div>
        )}
        <WaveHand visible />
      </div>

      {/* BODY + ARMS */}
      <div
        style={{
          position: "relative",
          width: totalW,
          height: bodyH,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Left arm */}
        <motion.div
          variants={leftArmVariants}
          animate="wave"
          style={{
            width: armW,
            height: armH,
            background: `linear-gradient(180deg, ${shirtColor} 38%, ${skinColor} 38%)`,
            borderRadius: armW / 2,
            transformOrigin: "50% 0%",
            flexShrink: 0,
            marginRight: 2,
          }}
        />

        {/* Torso */}
        <div
          style={{
            width: bodyW,
            height: bodyH,
            background: shirtColor,
            borderRadius: `${bodyW * 0.18}px ${bodyW * 0.18}px ${bodyW * 0.12}px ${bodyW * 0.12}px`,
            flexShrink: 0,
          }}
        />

        {/* Right arm */}
        <motion.div
          variants={rightArmVariants}
          animate="wave"
          style={{
            width: armW,
            height: armH,
            background: `linear-gradient(180deg, ${shirtColor} 38%, ${skinColor} 38%)`,
            borderRadius: armW / 2,
            transformOrigin: "50% 0%",
            flexShrink: 0,
            marginLeft: 2,
          }}
        />
      </div>

      {/* LEGS */}
      <div
        style={{
          width: bodyW,
          height: legH,
          display: "flex",
          gap: bodyW * 0.12,
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: legW,
            height: legH,
            background: pantsColor,
            borderRadius: `${legW * 0.3}px ${legW * 0.3}px ${legW * 0.5}px ${legW * 0.5}px`,
          }}
        />
        <div
          style={{
            width: legW,
            height: legH,
            background: pantsColor,
            borderRadius: `${legW * 0.3}px ${legW * 0.3}px ${legW * 0.5}px ${legW * 0.5}px`,
          }}
        />
      </div>

      {/* Ground shadow */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.2 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        style={{
          width: "80%",
          height: 6,
          background: "radial-gradient(ellipse, #000 0%, transparent 80%)",
          borderRadius: "50%",
          marginTop: 2,
          transformOrigin: "50% 50%",
        }}
      />
    </motion.div>
  );
}

// ─── Main PartnerPuppet ─────────────────────────────────────────────────────

export function PartnerPuppet() {
  const { partnerPresence } = usePresenceStore();
  const { partner } = useAuthStore();

  const bodyControls = useAnimation();
  const prevTyping = useRef<boolean | null>(null);

  const isPartnerInChat = partnerPresence?.current_path === "/chat";
  const isPartnerOnline = partnerPresence?.status === "online";
  const isTyping = !!partnerPresence?.is_typing;

  // Determine colours based on partner name
  const partnerName = partner?.display_name?.toLowerCase() || "";
  const isAryan = partnerName.includes("aryan");
  const isShraddha = partnerName.includes("shraddha");

  const shirtColor = isAryan ? "#3b82f6" : isShraddha ? "#ec4899" : "#7c3aed";
  const pantsColor = isAryan ? "#1e3a5f" : isShraddha ? "#4a0025" : "#1e1b4b";
  const dotColor = isAryan ? "bg-blue-400" : isShraddha ? "bg-pink" : "bg-accent";

  // Start idle bob on mount
  useEffect(() => {
    bodyControls.start({
      y: [0, -4, 0],
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Smoothly switch between idle ↔ typing without resetting animation
  useEffect(() => {
    if (prevTyping.current === isTyping) return;
    prevTyping.current = isTyping;

    bodyControls.start({
      y: isTyping ? [0, -7, 0] : [0, -4, 0],
      transition: {
        duration: isTyping ? 0.85 : 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    });
  }, [isTyping, bodyControls]);

  // Don't render at all if partner isn't even online
  if (!partner || !isPartnerOnline) return null;

  return (
    <AnimatePresence initial={false}>
      {isPartnerInChat && (
        <motion.div
          key="partner-puppet"
          // Rise up from below the screen edge — zero mount delay in React,
          // only the network round-trip before isPartnerInChat becomes true.
          initial={{ y: 220, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 220, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 480,
            damping: 28,
            mass: 0.6,
          }}
          // Absolute positioning works flawlessly on mobile as it anchors to the relative chat wrapper
          style={{
            position: "absolute",
            bottom: 74,        // just above the bottom nav
            left: 12,
            zIndex: 40,
            pointerEvents: "none",
          }}
        >
          <PuppetCharacter
            avatarSrc={partner.avatar_url}
            avatarAlt={partner.display_name || "Partner"}
            isTyping={isTyping}
            bodyControls={bodyControls}
            dotColor={dotColor}
            shirtColor={shirtColor}
            pantsColor={pantsColor}
            skinColor="#f5c5a3"
            headSize={44}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
