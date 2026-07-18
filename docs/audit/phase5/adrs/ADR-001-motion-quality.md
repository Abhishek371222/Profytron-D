# ADR-001 — Motion Quality Manager

- **Status:** Accepted
- **Date:** 2026-07-18

## Context
Binary reduced-motion is insufficient for trading UI under variable FPS / device load.

## Decision
Four quality levels: Ultra → High → Medium → Minimal. Auto-adapt from FPS, long tasks, hardwareConcurrency, deviceMemory, prefers-reduced-motion, Save-Data, battery. Presets read quality; features never branch.

## Rollback
`NEXT_PUBLIC_MOTION_ENGINE=0` disables engine paths; components fall back to prior behavior.
