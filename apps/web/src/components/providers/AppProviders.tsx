"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { MSWProvider } from "@/components/providers/MSWProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import { WorkspaceBootstrapController } from "@/components/auth/WorkspaceBootstrapController";
import { Toaster } from "sonner";
import React from "react";

function ThemedToaster() {
  const [theme, setTheme] = React.useState<"light" | "dark">("dark");

  React.useEffect(() => {
    const syncTheme = () => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    };
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return <Toaster richColors position="top-right" theme={theme} />;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <MSWProvider>
        <AuthProvider>
          <TooltipProvider>
            {children}
            <WorkspaceBootstrapController />
            <ThemedToaster />
          </TooltipProvider>
        </AuthProvider>
      </MSWProvider>
    </QueryProvider>
  );
}
