import { z } from "zod";
import { scheduleDevConsoleFilter } from "@/lib/dev-console-filter";

scheduleDevConsoleFilter();

z.config({ jitless: true });

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_RELEASE =
  process.env.NEXT_PUBLIC_SENTRY_RELEASE ||
  process.env.COMMIT_SHA ||
  process.env.GIT_SHA;

if (SENTRY_DSN) {
  // Defer Sentry until after first paint / idle so it stays off the landing critical path.
  const boot = () => {
    void import("@sentry/nextjs").then((Sentry) => {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV,
        ...(SENTRY_RELEASE ? { release: SENTRY_RELEASE } : {}),

        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,

        integrations: [
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],

        enabled: process.env.NODE_ENV === "production",

        beforeSend(event) {
          if (event.user) {
            delete event.user.ip_address;
          }
          return event;
        },
      });
    });
  };

  if (typeof window !== "undefined") {
    const schedule =
      typeof window.requestIdleCallback === "function"
        ? () => window.requestIdleCallback(boot, { timeout: 4000 })
        : () => setTimeout(boot, 1500);
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
  } else {
    boot();
  }
}

export async function onRouterTransitionStart(...args: unknown[]) {
  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRouterTransitionStart(...(args as Parameters<
    typeof Sentry.captureRouterTransitionStart
  >));
}
