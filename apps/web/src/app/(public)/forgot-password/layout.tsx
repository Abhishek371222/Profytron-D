import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

// Auth utility page — must not be indexed (no SEO value, avoids inheriting the
// root homepage title). The page itself is a client component, so metadata lives
// here in a server layout.
export const metadata: Metadata = buildPageMetadata({
  title: "Reset Password",
  description: "Request a password reset link for your Profytron account.",
  path: "/forgot-password",
  noIndex: true,
});

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
