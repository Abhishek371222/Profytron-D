import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

// Post-signup onboarding flow (covers /onboarding and /onboarding/risk) — gated,
// no SEO value, must not be indexed.
export const metadata: Metadata = buildPageMetadata({
  title: "Onboarding",
  description: "Set up your Profytron trading workspace.",
  path: "/onboarding",
  noIndex: true,
});

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
