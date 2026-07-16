/**
 * Earliest client bootstrap. Sets Zod jitless before page chunks construct
 * schemas, so Zod never probes `new Function("")` under production CSP.
 * Also initializes the browser Sentry SDK (formerly sentry.client.config.ts).
 */
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

z.config({ jitless: true });

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Capture 10% of transactions for performance tracing
    tracesSampleRate: 0.1,

    // Replay only on error sessions to control quota
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Don't send errors in development
    enabled: process.env.NODE_ENV === "production",

    beforeSend(event) {
      // Strip PII from error events
      if (event.user) {
        delete event.user.ip_address;
      }
      return event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
