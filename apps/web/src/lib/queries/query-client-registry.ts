import type { QueryClient } from '@tanstack/react-query';

/** Long-lived QueryClient from QueryProvider — used to wipe cache on logout. */
let registeredClient: QueryClient | null = null;

export function registerQueryClient(client: QueryClient) {
  registeredClient = client;
}

export function getRegisteredQueryClient(): QueryClient | null {
  return registeredClient;
}
