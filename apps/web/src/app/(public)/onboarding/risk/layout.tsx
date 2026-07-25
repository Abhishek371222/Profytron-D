import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Risk Profile",
  description: "Configure your Profytron risk profile and capital allocation.",
  path: "/onboarding/risk",
  noIndex: true,
});

export default function OnboardingRiskLayout({ children }: { children: React.ReactNode }) {
  return children;
}
