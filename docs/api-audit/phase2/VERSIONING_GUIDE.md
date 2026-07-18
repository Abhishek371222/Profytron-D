# VERSIONING_GUIDE.md

## When to version

| Change | Version? |
|--------|----------|
| Add optional response field | No (document in OpenAPI) |
| Remove/rename field | Yes — new path or explicit deprecation window |
| Change status codes for success path | Yes |
| Tighten validation rejecting previously valid bodies | Yes (or feature-flag) |
| Cache / internal batching | No |

## How

1. Prefer `/v2/...` controllers for breaking HTTP APIs.
2. Keep `/v1` stable until clients migrate.
3. WebSocket event renames are **breaking** — require dual-emit deprecation period.

## Phase 2 freeze

API platform patterns (envelope, throttling, cache ownership) are frozen; do not introduce parallel response formats.
