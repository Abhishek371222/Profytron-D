# API_STANDARDS.md — Frozen after Phase 2

## Naming

- Controllers: `<domain>.controller.ts`, `@Controller('kebab')`
- Routes under global prefix `/v1` (except `/health`)
- Public reads: prefer `@Public()` + documented OpenAPI

## Versioning

- Breaking changes require `/v2` or negotiated headers — see `VERSIONING_GUIDE.md`
- Additive response fields allowed; removals/renames are breaking

## DTO rules

- Request DTOs use `class-validator`; keep nesting shallow
- Do not change response shapes without a version bump
- `TransformInterceptor` envelope is part of the HTTP JSON contract

## Pagination

- Prefer cursor for large append-only lists; document `limit` caps
- Do not mix page/offset and cursor on the same route without docs

## Errors

- Use Nest HTTP exceptions; clients parse `AllExceptionsFilter` JSON
- Do not invent parallel error envelopes

## Caching

- Follow `CACHE_GOVERNANCE.md` — one owner per key/resource

## Validation

- Keep global ValidationPipe whitelist + forbidNonWhitelisted

## Rate limiting

- Default throttler + `@Throttle` on abuse-prone auth routes

## Ownership

- See `OWNERSHIP_MATRIX.md`
