"use client";

import { useEffect, useState } from"react";

declare global {
 interface Window {
 __MSW_STARTED__?: boolean;
 }
}

export function MSWProvider({ children }: { children: React.ReactNode }) {
 useEffect(() => {
 // Definitive singleton lock to prevent redundant worker initializations
 if (typeof window !=="undefined" && process.env.NODE_ENV ==="development") {
 // Force unregister all existing service workers to clear any stale Next.js chunks
 if ('serviceWorker' in navigator) {
 navigator.serviceWorker.getRegistrations().then((registrations) => {
 for (const registration of registrations) {
 registration.unregister();
 }
 });
 }

 const g = (globalThis || window) as Record<string, unknown>;
 if (g.__PROFYTRON_MSW_LOCK__) return;
 g.__PROFYTRON_MSW_LOCK__ = true;
 
 import("@/lib/mocks/browser").then(({ worker }) => {
 worker.start({ onUnhandledRequest:"bypass" })
 .catch((err: unknown) => {
 console.warn("[MSW] Init failure:", err);
 g.__PROFYTRON_MSW_LOCK__ = false;
 });
 });
 }
 }, []);

 return <>{children}</>;
}
