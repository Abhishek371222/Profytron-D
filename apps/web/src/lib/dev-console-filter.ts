/**
 * Dev-only console hygiene. Filters framework/HMR noise so local debugging
 * stays focused on real app errors.
 */
const LOG_SKIP =
  /\[HMR\]|^\[Fast Refresh\]|Download the React DevTools|\[Client Instrumentation Hook\]|Slow execution detected/;

type FilteredConsoleFn = ((...args: unknown[]) => void) & {
  __profytronFiltered?: boolean;
};

function shouldSkip(method: "log" | "warn" | "info", args: unknown[]): boolean {
  if (method === "warn") return true;
  const first = args[0];
  if (typeof first !== "string") return false;
  if (method === "log" || method === "info") return LOG_SKIP.test(first);
  return false;
}

function wrapConsoleMethod(method: "log" | "warn" | "info"): void {
  const current = console[method] as FilteredConsoleFn;
  if (current.__profytronFiltered) return;

  const wrapped: FilteredConsoleFn = (...args: unknown[]) => {
    if (shouldSkip(method, args)) return;
    return current.apply(console, args);
  };
  wrapped.__profytronFiltered = true;
  console[method] = wrapped;
}

export function installDevConsoleFilter(): void {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof window === "undefined" || typeof console === "undefined") return;

  wrapConsoleMethod("log");
  wrapConsoleMethod("warn");
  wrapConsoleMethod("info");
}

export function scheduleDevConsoleFilter(): void {
  installDevConsoleFilter();
  queueMicrotask(installDevConsoleFilter);
  window.setTimeout(installDevConsoleFilter, 0);
  window.setTimeout(installDevConsoleFilter, 250);
  window.addEventListener("DOMContentLoaded", installDevConsoleFilter, { once: true });
}
