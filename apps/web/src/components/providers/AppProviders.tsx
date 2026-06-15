"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/AuthProvider";
import { MSWProvider } from "@/components/providers/MSWProvider";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <MSWProvider>
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" theme="dark" />
          </TooltipProvider>
        </AuthProvider>
      </MSWProvider>
    </QueryProvider>
  );
}
