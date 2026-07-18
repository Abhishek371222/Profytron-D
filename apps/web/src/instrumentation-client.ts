import { z } from "zod";
import { scheduleDevConsoleFilter } from "@/lib/dev-console-filter";

scheduleDevConsoleFilter();

z.config({ jitless: true });

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  // Defer Sentry so instrumentation-client stays under Next's 16ms dev budget
  // (avoids "[Client Instrumentation Hook] Slow execution" log spam).
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,

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
}

export async function onRouterTransitionStart(...args: unknown[]) {
  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRouterTransitionStart(...(args as Parameters<
    typeof Sentry.captureRouterTransitionStart
  >));
}
