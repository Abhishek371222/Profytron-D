import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Risk DNA — Onboarding",
  description:
    "Configure capital, risk appetite, and safety controls for your Profytron forex trading workspace.",
  path: "/onboarding/risk",
  noIndex: true,
});

export default function OnboardingRiskLayout({ children }: { children: React.ReactNode }) {
  return children;
}
