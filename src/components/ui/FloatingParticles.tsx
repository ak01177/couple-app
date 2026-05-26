"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface FloatingParticlesProps {
  count?: number;
  className?: string;
}

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  color: string;
  driftX: number;
};

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
    opacity: Math.random() * 0.3 + 0.1,
    color:
      Math.random() > 0.5 ? "hsl(270, 45%, 58%)" : "hsl(340, 45%, 62%)",
    driftX: Math.random() > 0.5 ? 20 : -20,
  }));
}

export default function FloatingParticles({
  count = 20,
  className = "",
}: FloatingParticlesProps) {
  const [particles] = useState(() => createParticles(count));

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, particle.driftX, 0],
            opacity: [
              particle.opacity,
              particle.opacity + 0.2,
              particle.opacity,
            ],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
