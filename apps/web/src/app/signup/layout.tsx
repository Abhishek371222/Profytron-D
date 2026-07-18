import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import { pageSeo } from "@/lib/seo/page-metadata";

export const metadata: Metadata = pageSeo.register;

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
