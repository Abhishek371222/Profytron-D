import { AppProviders } from "@/components/providers/AppProviders";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
