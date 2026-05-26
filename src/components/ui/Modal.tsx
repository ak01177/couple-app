"use client";

import { motion, AnimatePresence } from "framer-motion";
import { overlayVariants, modalVariants } from "@/lib/animations";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showClose?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  showClose = true,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-md bg-bg-surface border border-border rounded-2xl shadow-glow overflow-hidden z-10"
          >
            {/* Header */}
            {(title || showClose) && (
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                {title && (
                  <h3 className="text-lg font-semibold text-text-primary">
                    {title}
                  </h3>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="px-5 pb-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
