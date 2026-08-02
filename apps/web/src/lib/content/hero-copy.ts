/**
 * Launch-approved homepage hero copy (PT-W03).
 * Single source of truth so strings never drift from landing.
 * Primary CTA: free trial → /register?plan=starter
 */
export const HERO_COPY = {
  eyebrow: "Live engine · MT5 ready",
  h1Lead: "Stop Trading",
  h1Rotate: ["Manually.", "Emotionally.", "Blindly.", "Slowly."] as const,
  h1SrOnly: " manually, emotionally, blindly, or slowly.",
  body: "Deploy automated forex strategies on MT4/MT5. Profytron handles execution, AI risk limits, and portfolio analytics — 24/7, without you watching the screen.",
  primaryCta: "Start 7-Day Free Trial",
  primaryHref: "/register?plan=starter",
  secondaryCta: "See How It Works",
  secondaryHref: "#how-it-works",
  trialPoints: ["No Credit Card", "7-Day Trial", "Cancel Anytime"] as const,
} as const;
