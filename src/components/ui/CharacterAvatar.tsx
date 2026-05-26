"use client";

import { motion } from "framer-motion";
import { getPublicUrl } from "@/lib/storage";
import type { OnlineStatus } from "@/types";

interface CharacterAvatarProps {
  src?: string | null;
  alt: string;
  status?: OnlineStatus;
  /** Delay the entrance animation by this many seconds */
  delay?: number;
  /** Size in px of the head circle */
  headSize?: number;
  /** Skin tone for body/limbs */
  skinColor?: string;
  /** Shirt color */
  shirtColor?: string;
  /** Pants color */
  pantsColor?: string;
}

const statusColors: Record<OnlineStatus, string> = {
  online: "#22c55e",
  offline: "#71717a",
  away: "#eab308",
};

export default function CharacterAvatar({
  src,
  alt,
  status,
  delay = 0,
  headSize = 52,
  skinColor = "#f5c5a3",
  shirtColor = "#a78bfa",
  pantsColor = "#4c1d95",
}: CharacterAvatarProps) {
  const resolvedSrc = src && !src.startsWith("http") ? getPublicUrl(src) : src;

  const initials = alt
    ? alt
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  // Total height of the character: head + body + legs
  const bodyW = headSize * 0.75;
  const bodyH = headSize * 0.85;
  const legH = headSize * 0.75;
  const legW = bodyW * 0.28;
  const armH = headSize * 0.7;
  const armW = headSize * 0.18;

  const totalH = headSize + bodyH + legH;
  // Wide enough for arms
  const totalW = bodyW + armW * 2 + 8;

  const cx = totalW / 2;

  // Animation: character drops from above and lands with a little bounce
  const containerVariants = {
    hidden: { y: -(totalH + 60), opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        delay,
        type: "spring" as const,
        stiffness: 180,
        damping: 14,
        mass: 1.2,
      },
    },
  };

  // Subtle idle sway
  const swayVariants = {
    idle: {
      rotate: [-1, 1, -1],
      transition: {
        repeat: Infinity,
        duration: 3,
        ease: "easeInOut" as const,
        delay: delay + 0.8,
      },
    },
  };

  // Arm wave animation
  const leftArmVariants = {
    wave: {
      rotate: [-10, -35, -10],
      transition: {
        repeat: Infinity,
        duration: 2.5,
        ease: "easeInOut" as const,
        delay: delay + 1,
      },
    },
  };

  const rightArmVariants = {
    wave: {
      rotate: [10, 30, 10],
      transition: {
        repeat: Infinity,
        duration: 2.8,
        ease: "easeInOut" as const,
        delay: delay + 1.4,
      },
    },
  };

  const headY = 0;
  const bodyY = headSize;
  const legsY = headSize + bodyH;

  return (
    <motion.div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        width: totalW,
        height: totalH,
        position: "relative",
        originX: "50%",
        originY: "100%",
      }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Sway wrapper — rotates around feet */}
      <motion.div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: totalW,
          height: totalH,
          transformOrigin: "50% 100%",
        }}
        variants={swayVariants}
        animate="idle"
      >
        {/* ── HEAD ── */}
        <div
          style={{
            position: "relative",
            width: headSize,
            height: headSize,
            flexShrink: 0,
          }}
        >
          {/* Head / face circle */}
          {resolvedSrc ? (
            <img
              src={resolvedSrc}
              alt={alt}
              style={{
                width: headSize,
                height: headSize,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2.5px solid rgba(255,255,255,0.25)",
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
                fontSize: headSize * 0.32,
                border: "2.5px solid rgba(255,255,255,0.25)",
              }}
            >
              {initials}
            </div>
          )}

          {/* Online status dot */}
          {status && (
            <span
              style={{
                position: "absolute",
                bottom: 1,
                right: 1,
                width: headSize * 0.22,
                height: headSize * 0.22,
                borderRadius: "50%",
                background: statusColors[status],
                border: "2px solid #13111a",
              }}
            />
          )}
        </div>

        {/* ── BODY + ARMS ROW ── */}
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

          {/* Torso / shirt */}
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

        {/* ── LEGS ── */}
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
          {/* Left leg */}
          <div
            style={{
              width: legW,
              height: legH,
              background: pantsColor,
              borderRadius: `${legW * 0.3}px ${legW * 0.3}px ${legW * 0.5}px ${legW * 0.5}px`,
            }}
          />
          {/* Right leg */}
          <div
            style={{
              width: legW,
              height: legH,
              background: pantsColor,
              borderRadius: `${legW * 0.3}px ${legW * 0.3}px ${legW * 0.5}px ${legW * 0.5}px`,
            }}
          />
        </div>
      </motion.div>

      {/* Shadow on the ground */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 0.25 }}
        transition={{ delay: delay + 0.35, duration: 0.4 }}
        style={{
          position: "absolute",
          bottom: -6,
          left: "50%",
          translateX: "-50%",
          width: totalW * 0.85,
          height: 6,
          background: "radial-gradient(ellipse, #000 0%, transparent 80%)",
          borderRadius: "50%",
          transformOrigin: "50% 50%",
        }}
      />
    </motion.div>
  );
}
