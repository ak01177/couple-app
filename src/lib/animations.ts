import type { Variants, Transition } from "framer-motion";

// === Shared Transitions ===

export const springTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1],
};

export const gentleTransition: Transition = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1],
};

// === Page Transitions ===

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const pageTransition: Transition = {
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1],
};

// === Fade Animations ===

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

// === Slide Animations ===

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
};

// === Scale Animations ===

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.5 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.8 },
};

// === Chat-Specific ===

export const messageBubbleSent: Variants = {
  initial: { opacity: 0, x: 20, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const messageBubbleReceived: Variants = {
  initial: { opacity: 0, x: -20, scale: 0.95 },
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export const typingIndicator: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: 0.15 },
  },
};

// === Reaction Animation ===

export const reactionPop: Variants = {
  initial: { opacity: 0, scale: 0, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 500, damping: 20 },
  },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.15 } },
};

// === Dashboard Widgets ===

export const widgetVariants: Variants = {
  initial: { opacity: 0, y: 24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// === Floating Particles ===

export const floatingParticle = (delay: number, duration: number) => ({
  animate: {
    y: [0, -30, 0],
    x: [0, Math.random() > 0.5 ? 15 : -15, 0],
    opacity: [0.2, 0.6, 0.2],
    scale: [1, 1.2, 1],
    transition: {
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
});

// === Modal / Drawer ===

export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.92, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } },
};

export const drawerVariants: Variants = {
  initial: { y: "100%" },
  animate: {
    y: 0,
    transition: { type: "spring", stiffness: 350, damping: 35 },
  },
  exit: {
    y: "100%",
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] },
  },
};

// === Heart Pulse ===

export const heartPulse: Variants = {
  animate: {
    scale: [1, 1.15, 1, 1.1, 1],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// === Notification Badge ===

export const badgePing: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};
