"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useUIStore } from "@/lib/stores/useUIStore";
import { cn } from "@/lib/utils";

type AIAssistantOrbProps = {
  className?: string;
  hasUnread?: boolean;
};

/** Floating AI assistant orb — soft pulsing glow, opens dashboard AI chat */
export function AIAssistantOrb({ className, hasUnread = false }: AIAssistantOrbProps) {
  const { aiChatOpen, toggleAIChat } = useUIStore();

  return (
    <div className={cn("fixed bottom-6 right-6 z-[90] sm:bottom-8 sm:right-8", className)}>
      {hasUnread && !aiChatOpen && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-destructive rounded-full border-2 border-background z-20"
        />
      )}

      {/* Outer pulse rings */}
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59,91,255,0.25) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        aria-hidden
        className="absolute inset-[-6px] rounded-full border border-primary/20"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />

      <motion.button
        type="button"
        onClick={toggleAIChat}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={aiChatOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={aiChatOpen}
        className={cn(
          "relative w-14 h-14 sm:w-[60px] sm:h-[60px] rounded-full flex items-center justify-center",
          "bg-gradient-cta text-primary-foreground shadow-cta",
          "border border-primary/20 overflow-visible",
          aiChatOpen && "ring-2 ring-primary/30",
        )}
      >
        <motion.div
          animate={{ rotate: aiChatOpen ? 180 : 0 }}
          transition={{ duration: 0.35 }}
        >
          <Sparkles className="w-6 h-6" />
        </motion.div>
      </motion.button>

      <motion.p
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none"
      >
        <span className="whitespace-nowrap text-caption font-medium text-muted-foreground bg-card border border-[var(--card-border)] px-2.5 py-1 rounded-full shadow-sm">
          AI Assistant
        </span>
      </motion.p>
    </div>
  );
}
