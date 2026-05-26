"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, FloatingParticles } from "@/components/ui";
import { Heart, User, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.replace("/home");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-bg-deep flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-accent/4 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-pink/3 blur-3xl" />
      </div>

      <FloatingParticles count={12} />

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Logo */}
        <motion.div
          className="flex flex-col items-center mb-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        >
          <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center shadow-glow mb-4">
            <Heart size={24} className="text-white fill-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Welcome back</h1>
          <p className="text-text-muted text-sm mt-1.5">
            Our little world awaits
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.form
          onSubmit={handleLogin}
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<User size={16} />}
            autoComplete="email"
            required
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 bg-error/10 border border-error/20 rounded-xl text-error text-sm"
            >
              {error}
            </motion.div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            isLoading={isLoading}
            className="mt-2"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </motion.form>

        {/* Footer */}
        <motion.p
          className="text-center text-text-muted text-xs mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Your cozy space 💕
        </motion.p>
      </motion.div>
    </div>
  );
}
