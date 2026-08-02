import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import AdminLayoutClient from "./AdminLayoutClient";

export const metadata: Metadata = buildPageMetadata({
  title: "Admin",
  description: "Profytron administration console",
  path: "/admin",
  noIndex: true,
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
