"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const ChatbotWidget = dynamic(
  () =>
    import("@/components/chatbot/ChatbotWidget").then((m) => ({
      default: m.ChatbotWidget,
    })),
  { ssr: false },
);

export function LazyChatbotWidget() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = () => setReady(true);

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(load, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = setTimeout(load, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return null;
  return <ChatbotWidget />;
}
