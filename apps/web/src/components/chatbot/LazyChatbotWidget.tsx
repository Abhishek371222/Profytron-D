"use client";

import dynamic from "next/dynamic";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/useUIStore";

const ChatbotWidget = dynamic(
  () =>
    import("@/components/chatbot/ChatbotWidget").then((m) => ({
      default: m.ChatbotWidget,
    })),
  { ssr: false },
);

const APP_SHELL_ROUTES = [
  "/dashboard",
  "/analytics",
  "/wallet",
  "/strategies",
  "/marketplace",
  "/journal",
  "/history",
  "/leaderboard",
  "/bots",
  "/get-bots",
  "/notifications",
  "/affiliate",
  "/creator",
  "/alpha-coach",
  "/settings",
  "/admin",
  "/my-bots",
  "/subscriptions",
  "/billing",
  "/team-plans",
  "/connected-accounts",
];

const EXTRA_BOTTOM_NAV_ROUTES = ["/markets"];

const HIDDEN_ROUTES = [
  "/login",
  "/register",
  "/signup",
  "/verify-email",
  "/reset-password",
  "/forgot-password",
  "/auth",
  "/onboarding",
];

/**
 * Loads the full chatbot bundle only when the user opens chat
 * (FAB click on public pages, or store open on app-shell routes).
 */
function LazyChatbotWidgetInner() {
  const pathname = usePathname();
  const aiChatOpen = useUIStore((s) => s.aiChatOpen);
  const [loaded, setLoaded] = useState(false);
  const [openOnMount, setOpenOnMount] = useState(false);

  const isHidden = HIDDEN_ROUTES.some(
    (r) => pathname === r || pathname?.startsWith(`${r}/`),
  );
  const isAppShell = APP_SHELL_ROUTES.some((r) => pathname?.startsWith(r));
  const clearsBottomNav =
    isAppShell || EXTRA_BOTTOM_NAV_ROUTES.some((r) => pathname?.startsWith(r));

  useEffect(() => {
    if (aiChatOpen) {
      setOpenOnMount(true);
      setLoaded(true);
    }
  }, [aiChatOpen]);

  if (isHidden) return null;

  if (!loaded) {
    // App-shell routes open chat via in-app controls (store) — no public FAB.
    if (isAppShell) return null;

    return (
      <div
        className={cn(
          "fixed z-[9999] flex flex-col items-end gap-3 select-none",
          clearsBottomNav
            ? "bottom-24 right-6 sm:bottom-28 sm:right-8"
            : "bottom-6 right-6",
        )}
      >
        <button
          type="button"
          onClick={() => {
            setOpenOnMount(true);
            setLoaded(true);
          }}
          className="w-14 h-14 rounded-[14px] bg-gradient-cta shadow-cta flex items-center justify-center border border-primary/20 relative overflow-visible"
          aria-label="Open Profytron AI chat"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-primary/50 animate-pulse"
          />
          <MessageCircle className="w-6 h-6 text-white relative z-10" />
        </button>
      </div>
    );
  }

  return <ChatbotWidget initialOpen={openOnMount} />;
}

export function LazyChatbotWidget() {
  return (
    <Suspense fallback={null}>
      <LazyChatbotWidgetInner />
    </Suspense>
  );
}
