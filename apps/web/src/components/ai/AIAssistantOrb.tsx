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
  const aiChatOpen = useUIStore((s) => s.aiChatOpen);
  const toggleAIChat = useUIStore((s) => s.toggleAIChat);

  return (
    <div className={cn("hidden lg:block fixed right-4 z-[90] bottom-8 lg:right-8", className)}>
      {hasUnread && !aiChatOpen && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-destructive rounded-full border-2 border-background z-20"
        />
      )}

      <motion.button
        type="button"
        onClick={toggleAIChat}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-label={aiChatOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={aiChatOpen}
        className={cn(
          "relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center",
          "bg-gradient-cta text-white shadow-md shadow-primary/25",
          "border border-primary/20",
          aiChatOpen && "ring-2 ring-primary/30",
        )}
      >
        <motion.div
          animate={{ rotate: aiChatOpen ? 180 : 0 }}
          transition={{ duration: 0.35 }}
        >
          <Sparkles className="w-5 h-5" />
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
