# Phase 1B Measurement Matrix

```mermaid
flowchart TB
  subgraph phase1 [Phase 1 - Display]
    shots[Screenshots + layout probe]
    vp[23 viewports / DPI / zoom]
  end
  subgraph phase1b [Phase 1B - Runtime]
    tierA[Tier A - all pages x 3 viewports Chromium]
    tierB[Tier B - deep scroll animation memory React]
    tierC[Tier C - Firefox WebKit smoke]
  end
  subgraph domains [Domains]
    cwv[CWV / paint]
    net[Network / JS]
    img[Images]
    scroll[Scroll / animation]
    a11y[A11y]
    layout[Layout runtime integrity]
  end
  phase1 -.->|route manifest auth patterns| phase1b
  tierA --> domains
  tierB --> domains
  tierC --> domains
  domains --> debt[RUNTIME_DEBT_LIST + PHASE2_INPUTS]
```

Phase 1 evidence stays display-authoritative. Phase 1B does not re-litigate viewport screenshot matrices unless a runtime layout defect requires a linking screenshot.
