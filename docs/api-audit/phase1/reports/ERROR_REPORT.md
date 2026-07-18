# ERROR_REPORT — API Audit Phase 1

Filter: `AllExceptionsFilter` (global).

## Sample probes

| Name | Method | Path | Status | Keys |
|------|--------|------|-------:|------|
| unauthorized_me | GET | `/v1/users/me` | 401 | success, statusCode, error, code, timestamp, path |
| not_found | GET | `/v1/this-route-does-not-exist-audit` | 404 | success, statusCode, error, code, timestamp, path |
| bad_login | POST | `/v1/auth/login` | 400 | success, statusCode, error, code, timestamp, path |

## Consistency notes

Document observed shapes only — do not change filters in Phase 1.
