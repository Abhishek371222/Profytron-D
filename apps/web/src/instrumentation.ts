/**
 * Server/edge process start. Keep Zod in jitless mode so SSR validation
 * matches the client CSP-safe configuration.
 */
export async function register() {
  const { z } = await import("zod");
  z.config({ jitless: true });
}
