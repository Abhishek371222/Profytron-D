/** Redis key prefix for the "currently active tab/device" session marker. */
export const ACTIVE_SESSION_KEY_PREFIX = 'auth:activesession:';

/**
 * How long a claimed active session stays authoritative without being
 * refreshed. Generous on purpose: this only needs to outlast the interaction
 * throttle on the frontend (which re-claims every ~30s while a tab is in
 * use) — if it lapses, enforcement just goes quiet again (falls through to
 * "no active session claimed"), it never locks anyone out.
 */
export const ACTIVE_SESSION_TTL_SECONDS = 24 * 60 * 60;
