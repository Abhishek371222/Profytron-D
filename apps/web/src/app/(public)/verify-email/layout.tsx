import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

// Auth utility page — must not be indexed. Metadata lives here because the page
// is a client component.
export const metadata: Metadata = buildPageMetadata({
  title: "Verify Your Email",
  description: "Enter the verification code sent to your email to activate your Profytron account.",
  path: "/verify-email",
  noIndex: true,
});

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
