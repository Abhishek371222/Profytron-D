# Spline scene authoring checklist

- Keep each scene package ≤ 1–3 MB (registry `downloadMb`).
- Split layers: background → logo/product → particles → glass (stream independently when possible).
- Author against **BrandLighting** (key/fill/rim/exposure/subtle bloom) — no per-scene neon purple.
- Export a static poster (WebP/AVIF) for every registry key before shipping the interactive URL.
- Particle counts: hundreds max; gate via LOD / FPS degrade.
- Set `NEXT_PUBLIC_SPLINE_*` env URLs; empty URL = poster + CSS depth only (valid for mobile/CI).
- Never import `@splinetool/*` from pages — only SceneManager may mount WebGL.
