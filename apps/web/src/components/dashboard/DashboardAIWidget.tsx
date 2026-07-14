"use client";

import React, { useState } from "react";
import { Sparkles, Send, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/useUIStore";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

type Props = {
  sharpeRatio?: number;
};

export function DashboardAIWidget({ sharpeRatio = 0 }: Props) {
  const { data: user } = useCurrentUser();
  const firstName = user?.fullName?.split(" ")[0] || user?.name?.split(" ")[0] || "there";

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const setAIChatOpen = useUIStore((s) => s.setAIChatOpen);

  React.useEffect(() => {
    setMessages([
      {
        role: "assistant",
        text: `Hi ${firstName}! I'm your AI trading assistant. Ask about markets, bots, or your portfolio — I'm synced to your live account data.`,
      },
    ]);
  }, [firstName]);

  const send = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || loading) return;
    if (!preset) setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const reply = data?.reply || data?.message || "I couldn't process that. Try again.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Connection issue — tap Expand for the full assistant." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sharpeLabel = sharpeRatio > 0 ? `Sharpe ${sharpeRatio.toFixed(2)}` : "Sharpe";

  return (
    <div className="dashboard-card flex flex-col overflow-hidden dashboard-enter" style={{ animationDelay: "0.2s" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--card-border)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">AI Assistant</span>
        </div>
        <button
          type="button"
          onClick={() => setAIChatOpen(true)}
          className="text-xs font-medium text-primary hover:underline"
        >
          Expand
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[140px] max-h-[180px] custom-scrollbar">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn("flex dashboard-enter", msg.role === "user" ? "justify-end" : "justify-start")}
            style={{ animationDelay: `${0.05 * i}s` }}
          >
            <div
              className={cn(
                "max-w-[92%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md border border-[var(--card-border)]",
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-1.5 px-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-3 pt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => send(`How is my Sharpe ratio of ${sharpeRatio.toFixed(2)}? Any improvements?`)}
          className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <TrendingUp className="h-3 w-3" />
          {sharpeLabel}
        </button>
      </div>

      <div className="p-3 border-t border-[var(--card-border)] shrink-0">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-background px-3 py-2.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask anything..."
            className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:bg-[var(--primary-hover)] transition-colors"
            aria-label="Send message"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
