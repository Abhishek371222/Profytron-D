# OPENAPI_COMPLETION — Phase 2

**Evidence:** Phase 1 `OPENAPI_REVIEW.md` (~119 heuristic gaps; swagger available non-prod)

## Completed this phase

| Change | File |
|--------|------|
| `@ApiResponse` on `GET /subscriptions/plans` | `subscriptions.controller.ts` |

## Status

- Controllers already heavily use `@ApiTags` / `@ApiOperation` / `@ApiResponse` on market, copy, leaderboard, auth.
- Remaining gaps are mostly authed admin/analytics routes missing examples — document in backlog; full 288-path parity is incremental.

## Rule going forward

New public endpoints **must** ship with `@ApiTags`, `@ApiOperation`, and at least one `@ApiResponse` (see `API_STANDARDS.md`).
