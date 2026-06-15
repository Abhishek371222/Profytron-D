import { AppProviders } from "@/components/providers/AppProviders";

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
