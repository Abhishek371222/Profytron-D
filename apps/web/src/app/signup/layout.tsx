import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import { pageSeo } from "@/lib/seo/page-metadata";

// /signup renders the same form as /register. Reuse the register metadata so its
// canonical URL points at /register — this consolidates the duplicate into one
// indexable page instead of two competing for the same content.
export const metadata: Metadata = pageSeo.register;

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
