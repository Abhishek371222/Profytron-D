# Shared State Rules

## Allowed

```
Component → Selector → Query → Cache → API
```

Features consume Application Core selectors and `platform.data()` / `platform.cache()`.

## Forbidden

```
Component → API
Feature → platform/*/internal/*
Dashboard → Infrastructure (axios / socket factories)
```

## Enforcement

ESLint `no-restricted-imports` in `apps/web/eslint.config.mjs` blocks:

- `@/platform/**/internal/**` from `src/app/**` and `src/components/**`
- Direct `@/lib/api/*` from Overview widgets (prefer platform.data)

Transport modules under `lib/api` and `lib/realtime` remain for platform internals and gradual migration.
