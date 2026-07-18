/** Feature flag helper kept tiny to avoid circular imports. */
export function isMotionEngineEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MOTION_ENGINE !== '0';
}
