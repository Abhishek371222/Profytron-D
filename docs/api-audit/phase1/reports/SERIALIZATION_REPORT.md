# SERIALIZATION_REPORT — API Audit Phase 1

## TransformInterceptor

File: `apps/api/src/common/interceptors/transform.interceptor.ts`

- Wraps JSON responses as `{ success: true, data, timestamp }`
- Skips `Buffer` / `StreamableFile` / `Uint8Array`
- Cost: one object allocation + `JSON.stringify` of envelope per response (not separately timed without interceptor)

## class-transformer

Enabled via ValidationPipe `transform: true` + `enableImplicitConversion: true` on inbound DTOs.

## Findings (measure-only)

- Envelope adds fixed key overhead to every JSON response (see PAYLOAD_REPORT `wrapped: true`).
- No product change in Phase 1.
