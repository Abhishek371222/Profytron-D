# SERVICE_GUIDE.md

## Layering

Controller → (ValidationPipe) → Service → Prisma / Redis / adapters

- Controllers: HTTP mapping only
- Services: business orchestration
- Do not call Prisma from controllers

## Performance habits

1. Batch Prisma (`findMany` + `in`, `$transaction` arrays) — see DB Phase 2
2. Cache public read-mostly lists with a single owner
3. Avoid N+1 loops across Neon RTT
4. Prefer `RedisService.cached` for upstream HTTP

## Size

If a service exceeds ~1500 LOC, split **internal** helpers first; public module splits need an ADR.
