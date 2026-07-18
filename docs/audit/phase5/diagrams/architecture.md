# Phase 5 — Motion Architecture

```mermaid
flowchart TD
  UI[Component / Interaction] --> API["platform.motion()"]
  API --> Queue[motion-queue]
  Queue --> Quality[motion-quality]
  Quality --> Presets[motion-presets]
  Presets --> Tokens[motion-tokens]
  Presets --> Springs[motion-springs]
  API --> Num[motion-number]
  Queue --> Conflict[motion-conflicts]
  Conflict --> Reg[motion-registry]
  Reg --> Timeline[motion-timeline]
  Reg --> Recovery[motion-recovery]
  Reg --> Life["lifecycleApi"]
  Reg --> Anim["animationApi"]
  API --> A11y[motion-accessibility]
  API --> Obs[motion-observability]
  Timeline --> Obs
  Obs --> Metrics["metricsApi"]
  Obs --> Profiler[MotionProfilerOverlay]
  Num --> Sched["render scheduler"]
  Sched --> Browser --> GPU
```

## Pipeline

1. Feature requests motion via `platform.motion()` presets / number API.
2. Job enters **queue** lane (Critical → Idle).
3. **Quality Manager** scales duration / disables decorative / springs.
4. **Conflict resolver** claims `(element, property)`.
5. **Registry** owns lifecycle + pause/resume via lifecycle + animation APIs.
6. **Timeline** records Created → … → Disposed.
7. **Recovery** finishes or cancels so UI never stays mid-tween.
