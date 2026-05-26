"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import FloatingParticles from "@/components/ui/FloatingParticles";
import { Heart } from "lucide-react";

export default function SplashPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"entering" | "showing" | "leaving">(
    "entering"
  );

  useEffect(() => {
    let cancelled = false;

    // Show the loading text slightly faster
    const showTimer = setTimeout(() => setPhase("showing"), 150);

    const checkAuthAndNavigate = async () => {
      const startTime = Date.now();
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const elapsed = Date.now() - startTime;
      const minDelay = 800; // Only wait 800ms minimum for the animation
      const remainingTime = Math.max(0, minDelay - elapsed);

      setTimeout(() => {
        if (cancelled) return;
        setPhase("leaving");

        setTimeout(() => {
          if (cancelled) return;
          const destination = user ? "/home" : "/login";
          startTransition(() => {
            router.replace(destination);
          });
        }, 300); // Wait just 300ms for the leaving animation to play
      }, remainingTime);
    };

    checkAuthAndNavigate();

    return () => {
      cancelled = true;
      clearTimeout(showTimer);
    };
  }, [router]);

  return (
    <div className="fixed inset-0 bg-bg-deep flex items-center justify-center overflow-hidden">
      {/* Ambient gradient background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-pink/5 blur-3xl" />
      </div>

      <FloatingParticles count={15} />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        animate={{
          opacity: phase === "leaving" ? 0 : 1,
          y: phase === "leaving" ? -20 : 0,
        }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Heart icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{
            scale: phase !== "entering" ? 1 : 0,
            rotate: 0,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.1,
          }}
          className="relative"
        >
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-glow">
            <Heart size={28} className="text-white fill-white" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-2xl gradient-bg opacity-40 blur-xl"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.2, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* App name */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{
            opacity: phase !== "entering" ? 1 : 0,
            y: phase !== "entering" ? 0 : 16,
          }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold gradient-text tracking-tight">
            AS
          </h1>
          <motion.p
            className="text-text-muted text-sm mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === "showing" ? 1 : 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            Aryan & Shraddha
          </motion.p>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          className="flex gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === "showing" ? 0.6 : 0 }}
          transition={{ delay: 0.8 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-accent"
              animate={{
                opacity: [0.3, 1, 0.3],
                y: [0, -4, 0],
              }}
              transition={{
                duration: 1,
                delay: i * 0.15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
