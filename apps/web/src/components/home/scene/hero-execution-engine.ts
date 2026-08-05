/**
 * Autonomous Execution Core — framework-free 2D canvas scene.
 *
 * No market imagery is baked into this artwork. Raw, noisy signals travel
 * through rotating risk gates; rejected branches dissipate while accepted
 * signals leave the core as ordered execution pulses. Dark and light share
 * every coordinate and motion value and only swap drawing materials.
 */

import { EXECUTION_CORE } from "./hero-scene-config";

type ThemeMode = "dark" | "light";
type Point = { x: number; y: number };
type PathSpec = {
  startX: number;
  startY: number;
  endAngle: number;
  family: 0 | 1;
  bend: number;
};
type RibbonSample = {
  x: number;
  y: number;
  /** Unit normal, so the two edges are centreline ± normal·half. */
  nx: number;
  ny: number;
  half: number;
  t: number;
};
type RibbonStrand = {
  samples: RibbonSample[];
  length: number;
  /** Which of the mark's two colours this strand's body leans toward. */
  tint: "cyan" | "crimson";
};
type Signal = {
  lane: number;
  phase: number;
  speed: number;
  size: number;
  rejected: boolean;
  branch: number;
};

const PATHS: PathSpec[] = [
  { startX: 0.358, startY: 0.17, endAngle: 3.72, family: 0, bend: -0.12 },
  { startX: 0.408, startY: 0.29, endAngle: 3.45, family: 0, bend: 0.08 },
  { startX: 0.328, startY: 0.43, endAngle: 3.16, family: 0, bend: -0.05 },
  { startX: 0.398, startY: 0.61, endAngle: 2.88, family: 0, bend: 0.09 },
  { startX: 0.498, startY: 0.82, endAngle: 2.35, family: 0, bend: 0.13 },
  { startX: 0.64, startY: 1.04, endAngle: 1.78, family: 1, bend: -0.1 },
  { startX: 0.91, startY: 1.02, endAngle: 1.05, family: 1, bend: 0.11 },
  { startX: 1.03, startY: 0.78, endAngle: 0.45, family: 1, bend: -0.08 },
  { startX: 1.04, startY: 0.22, endAngle: -0.52, family: 1, bend: 0.08 },
  { startX: 0.82, startY: -0.05, endAngle: -1.42, family: 1, bend: -0.12 },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function seeded(index: number) {
  const x = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function withAlpha(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha)})`;
}

function cubic(a: Point, b: Point, c: Point, d: Point, t: number): Point {
  const q = 1 - t;
  const q2 = q * q;
  const t2 = t * t;
  return {
    x: q2 * q * a.x + 3 * q2 * t * b.x + 3 * q * t2 * c.x + t2 * t * d.x,
    y: q2 * q * a.y + 3 * q2 * t * b.y + 3 * q * t2 * c.y + t2 * t * d.y,
  };
}

function cubicTangent(
  a: Point,
  b: Point,
  c: Point,
  d: Point,
  t: number,
): Point {
  const q = 1 - t;
  return {
    x:
      3 * q * q * (b.x - a.x) +
      6 * q * t * (c.x - b.x) +
      3 * t * t * (d.x - c.x),
    y:
      3 * q * q * (b.y - a.y) +
      6 * q * t * (c.y - b.y) +
      3 * t * t * (d.y - c.y),
  };
}

export class HeroExecutionEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly reduced: boolean;

  private w = 0;
  private h = 0;
  private mobile = false;
  private tablet = false;
  private theme: ThemeMode;
  private signals: Signal[] = [];
  /** Smoothed iris opening, 0–1. Persisted so it eases rather than snapping. */
  private apertureOpen = EXECUTION_CORE.motion.aperture.restOpen;
  private raf = 0;
  private resizeTimer = 0;
  private lastTime = 0;
  private lastMobileFrame = 0;
  private running = false;
  private disposed = false;
  private scrollProgress = 0;
  private readonly finePointer: boolean;
  private depth = { targetX: 0, targetY: 0, x: 0, y: 0, active: false };
  private themeObserver: MutationObserver | null = null;
  private figureImages: {
    bull: HTMLImageElement | null;
    bear: HTMLImageElement | null;
  } = { bull: null, bear: null };
  private figureLayers: Partial<Record<ThemeMode, HTMLCanvasElement>> = {};
  /**
   * Ribbon centreline, normals and half-widths. The shape is static — only
   * the lit arcs travel along it — so it is built once per footprint and
   * rebuilt only when the core radius changes. Keyed on `size`, so a resize
   * that lands on the same footprint reuses it.
   */
  private ribbonGeom: {
    size: number;
    strands: RibbonStrand[];
  } | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
    this.reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    this.finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches;
    this.theme = HeroExecutionEngine.detectTheme();
  }

  private static detectTheme(): ThemeMode {
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  }

  private loadImage(src: string) {
    return new Promise<HTMLImageElement | null>((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  private async loadAssets() {
    const [bull, bear] = await Promise.all([
      EXECUTION_CORE.figures.enabled
        ? this.loadImage(EXECUTION_CORE.assets.bull)
        : Promise.resolve(null),
      EXECUTION_CORE.figures.enabled
        ? this.loadImage(EXECUTION_CORE.assets.bear)
        : Promise.resolve(null),
    ]);
    if (this.disposed) return;
    this.figureImages = { bull, bear };
    this.rebuildFigureLayers();
    this.render(this.lastTime);
  }

  private onResize = () => {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => this.resize(), 160);
  };

  private onThemeChange = (event: Event) => {
    const mode = (event as CustomEvent<{ theme?: ThemeMode }>).detail?.theme;
    this.setTheme(
      mode === "dark" || mode === "light"
        ? mode
        : HeroExecutionEngine.detectTheme(),
    );
  };

  private onPointerMove = (event: PointerEvent) => {
    if (!this.finePointer || this.mobile || this.reduced) return;
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      this.depth.targetX = 0;
      this.depth.targetY = 0;
      this.depth.active = false;
      return;
    }
    this.depth.targetX = clamp((x / rect.width - 0.5) * 2, -1, 1);
    this.depth.targetY = clamp((y / rect.height - 0.5) * 2, -1, 1);
    this.depth.active = true;
  };

  private onScroll = () => {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.height) return;
    this.scrollProgress = clamp(-rect.top / rect.height);
    if (this.reduced) this.render(this.lastTime);
  };

  start() {
    if (this.disposed) return;
    this.resize();
    void this.loadAssets();
    window.addEventListener("resize", this.onResize, { passive: true });
    window.addEventListener("pointermove", this.onPointerMove, {
      passive: true,
    });
    window.addEventListener("scroll", this.onScroll, { passive: true });
    window.addEventListener("profytron:theme-change", this.onThemeChange);
    this.themeObserver = new MutationObserver(() => {
      this.setTheme(HeroExecutionEngine.detectTheme());
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    this.onScroll();
    if (this.reduced) {
      this.render(0);
      return;
    }
    this.resume();
  }

  pause() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  resume() {
    if (this.disposed || this.reduced || this.running) return;
    this.running = true;
    this.raf = requestAnimationFrame(this.tick);
  }

  dispose() {
    this.disposed = true;
    this.pause();
    window.clearTimeout(this.resizeTimer);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("scroll", this.onScroll);
    window.removeEventListener("profytron:theme-change", this.onThemeChange);
    this.themeObserver?.disconnect();
  }

  private setTheme(mode: ThemeMode) {
    if (mode === this.theme) return;
    this.theme = mode;
    // The document View Transition owns the reveal; paint its destination now.
    this.render(this.lastTime);
  }

  private tick = (now: number) => {
    if (!this.running || this.disposed) return;
    if (
      this.mobile &&
      now - this.lastMobileFrame < EXECUTION_CORE.motion.depth.mobileFrameMs
    ) {
      this.raf = requestAnimationFrame(this.tick);
      return;
    }
    this.lastMobileFrame = now;
    if (!this.depth.active) {
      this.depth.targetX = 0;
      this.depth.targetY = 0;
    }
    this.depth.x +=
      (this.depth.targetX - this.depth.x) * EXECUTION_CORE.motion.depth.lerp;
    this.depth.y +=
      (this.depth.targetY - this.depth.y) * EXECUTION_CORE.motion.depth.lerp;
    this.lastTime = now * 0.001;
    this.render(this.lastTime);
    this.raf = requestAnimationFrame(this.tick);
  };

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    this.mobile = window.matchMedia("(max-width: 767px)").matches;
    this.tablet =
      !this.mobile && window.matchMedia("(max-width: 1023px)").matches;
    const scale = Math.min(
      1,
      EXECUTION_CORE.canvas.maxWidth / rect.width,
      EXECUTION_CORE.canvas.maxHeight / rect.height,
    );
    this.w = Math.max(1, Math.round(rect.width * scale));
    this.h = Math.max(1, Math.round(rect.height * scale));
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    this.buildSignals();
    this.rebuildFigureLayers();
    this.render(this.lastTime);
  }

  private buildSignals() {
    const count = this.mobile
      ? EXECUTION_CORE.signals.mobileCount
      : EXECUTION_CORE.signals.desktopCount;
    this.signals = Array.from({ length: count }, (_, index) => ({
      lane: index % this.laneCount,
      phase: seeded(index + 3),
      speed: 0.055 + seeded(index + 17) * 0.06,
      size: 0.7 + seeded(index + 31) * 1.45,
      rejected: seeded(index + 47) < EXECUTION_CORE.signals.rejectedRatio,
      branch: seeded(index + 67) > 0.5 ? 1 : -1,
    }));
  }

  /**
   * Precompose the large cutouts once per size and theme. Per-frame work is a
   * single canvas copy, and the figures remain shadows rather than foreground
   * illustrations: light uses ink-like multiply, dark retains only rim light.
   */
  private rebuildFigureLayers() {
    this.figureLayers = {};
    if (
      !EXECUTION_CORE.figures.enabled ||
      !this.w ||
      !this.h ||
      !this.figureImages.bull ||
      !this.figureImages.bear
    ) {
      return;
    }

    const placement = this.mobile
      ? EXECUTION_CORE.figures.mobile
      : EXECUTION_CORE.figures.desktop;
    const height =
      this.h *
      (this.mobile
        ? EXECUTION_CORE.figures.mobileHeight
        : EXECUTION_CORE.figures.desktopHeight);

    (["dark", "light"] as const).forEach((mode) => {
      const layer = document.createElement("canvas");
      layer.width = this.w;
      layer.height = this.h;
      const layerCtx = layer.getContext("2d");
      if (!layerCtx) return;

      layerCtx.imageSmoothingEnabled = true;
      layerCtx.imageSmoothingQuality = "high";
      layerCtx.globalAlpha = EXECUTION_CORE.figures.opacity[mode];
      layerCtx.globalCompositeOperation =
        mode === "dark" ? "screen" : "multiply";
      layerCtx.filter =
        mode === "dark"
          ? "saturate(0.8) brightness(0.72) contrast(1.08)"
          : "saturate(0.46) brightness(0.72) contrast(1.12)";

      const drawFigure = (image: HTMLImageElement, centerX: number) => {
        const width = height * (image.naturalWidth / image.naturalHeight);
        layerCtx.drawImage(
          image,
          centerX * this.w - width / 2,
          placement.top * this.h,
          width,
          height,
        );
      };

      drawFigure(this.figureImages.bull!, placement.bullX);
      drawFigure(this.figureImages.bear!, placement.bearX);
      layerCtx.filter = "none";
      this.figureLayers[mode] = layer;
    });
  }

  private drawFigures() {
    const layer = this.figureLayers[this.theme];
    if (layer) this.ctx.drawImage(layer, 0, 0);
  }

  private geometry() {
    const layout = this.mobile
      ? EXECUTION_CORE.layout.mobile
      : this.tablet
        ? EXECUTION_CORE.layout.tablet
        : EXECUTION_CORE.layout.desktop;
    const baseRadius = this.mobile
      ? Math.min(this.w * 0.195, this.h * layout.radius)
      : Math.min(this.w, this.h) * layout.radius;
    // In expand mode the core holds still; scroll is expressed as the field
    // breathing outward instead of the whole assembly sliding sideways.
    const drift =
      EXECUTION_CORE.scroll.mode === "drift"
        ? this.scrollProgress * EXECUTION_CORE.motion.scrollConverge
        : 0;
    const baseX = this.w * (layout.x - drift);
    const baseY = this.h * layout.y;
    return { x: baseX, y: baseY, radius: baseRadius };
  }

  /**
   * Direction a rail runs, and which animal's colour it carries.
   *
   * In radial mode the fan is spaced evenly around the core so no quadrant is
   * favoured, and colour follows the hemisphere — teal toward the bull on the
   * left, crimson toward the bear on the right — rather than the authored
   * family, which assumed the old left/right start positions.
   */
  /** Rail growth from scroll. 1 at rest, 1 + railExpand fully scrolled. */
  private railExpansion() {
    if (EXECUTION_CORE.scroll.mode !== "expand") return 1;
    return 1 + this.scrollProgress * EXECUTION_CORE.scroll.railExpand;
  }

  /** Checkpoint orbit growth from scroll. Rest radius is untouched. */
  private orbitExpansion() {
    if (EXECUTION_CORE.scroll.mode !== "expand") return 1;
    return 1 + this.scrollProgress * EXECUTION_CORE.scroll.orbitExpand;
  }

  /** How many rails exist. Radial mode generates its own; anchored uses PATHS. */
  private get laneCount() {
    return EXECUTION_CORE.paths.style === "radial"
      ? EXECUTION_CORE.paths.radialCount
      : PATHS.length;
  }

  /**
   * A radial rail, derived entirely from its index.
   *
   * Even spacing alone produces a wheel, so each rail carries a seeded angular
   * offset and its own reach — that scatter is what stops the fan reading as a
   * starburst.
   */
  private radialLane(index: number) {
    const cfg = EXECUTION_CORE.paths;
    return {
      angle:
        (index / cfg.radialCount) * Math.PI * 2 +
        cfg.angleOffset +
        (seeded(index * 11 + 5) - 0.5) * cfg.angleJitter,
      reachScale: cfg.reach + seeded(index * 5 + 3) * cfg.reachJitter,
      bend: (seeded(index * 7 + 9) - 0.5) * cfg.bow,
    };
  }

  private pathIsBull(spec: PathSpec | undefined, index: number) {
    if (EXECUTION_CORE.paths.style !== "radial") return spec?.family === 0;
    return Math.cos(this.radialLane(index).angle) < 0;
  }

  private pathPoints(
    spec: PathSpec | undefined,
    core: Point,
    radius: number,
    index = 0,
  ) {
    if (EXECUTION_CORE.paths.style === "radial") {
      const cfg = EXECUTION_CORE.paths;
      const lane = this.radialLane(index);
      const dir = { x: Math.cos(lane.angle), y: Math.sin(lane.angle) };
      // Clamped in screen terms, not just against the core radius — otherwise
      // a horizontal rail spans the full width while a diagonal one stops at
      // the corner, and the horizontals become their own visual feature.
      //
      // The clamp is applied to the rest size and the scroll expansion is
      // layered on afterwards, so the breath is never capped partway through.
      const reach =
        Math.min(
          radius * lane.reachScale,
          Math.min(this.w, this.h) * cfg.maxReach,
        ) * this.railExpansion();
      const inner = radius * 1.62;

      // The fan is flattened vertically so it spreads into the wide hero
      // rather than radiating as an even circle.
      const start = {
        x: core.x + dir.x * reach,
        y: core.y + dir.y * reach * cfg.squashY,
      };
      const end = { x: core.x + dir.x * inner, y: core.y + dir.y * inner };

      // The squash does nothing at angle 0, so near-horizontal rails would be
      // the only straight lines in the fan. Bow and lift both scale with how
      // horizontal a rail is, so every one of them curves.
      const horiz = Math.abs(dir.x);
      const bow = lane.bend * radius * (1 + horiz * cfg.horizontalBow);
      const lift = this.h * cfg.controlLift * (0.6 + horiz * 0.9);

      // Single control point, then converted to cubic — a gentle asymmetric
      // arc rather than a straight spoke.
      const ctrl = {
        x: (start.x + end.x) / 2 - dir.y * bow,
        y: (start.y + end.y) / 2 - lift + dir.x * bow,
      };
      return {
        start,
        c1: {
          x: start.x + ((ctrl.x - start.x) * 2) / 3,
          y: start.y + ((ctrl.y - start.y) * 2) / 3,
        },
        c2: {
          x: end.x + ((ctrl.x - end.x) * 2) / 3,
          y: end.y + ((ctrl.y - end.y) * 2) / 3,
        },
        end,
      };
    }

    const s = spec as PathSpec;
    const start = { x: s.startX * this.w, y: s.startY * this.h };
    const end = {
      x: core.x + Math.cos(s.endAngle) * radius * 1.62,
      y: core.y + Math.sin(s.endAngle) * radius * 1.62,
    };
    const normal = { x: -Math.sin(s.endAngle), y: Math.cos(s.endAngle) };
    const c1 = {
      x: start.x + (end.x - start.x) * 0.36,
      y: start.y + (end.y - start.y) * 0.2 + s.bend * this.h,
    };
    const c2 = {
      x:
        end.x +
        Math.cos(s.endAngle) * radius * 1.3 +
        normal.x * s.bend * this.h * 0.3,
      y:
        end.y +
        Math.sin(s.endAngle) * radius * 1.3 +
        normal.y * s.bend * this.h * 0.3,
    };
    return { start, c1, c2, end };
  }

  private drawBackground(
    time: number,
    material: (typeof EXECUTION_CORE.theme)[ThemeMode],
    offset: Point,
  ) {
    const ctx = this.ctx;
    // The stage element owns the solid theme surface. Keeping this canvas
    // transparent lets the cutouts live behind every technical layer and core.
    ctx.clearRect(0, 0, this.w, this.h);

    const wash = ctx.createRadialGradient(
      this.w * 0.76,
      this.h * 0.52,
      0,
      this.w * 0.76,
      this.h * 0.52,
      Math.max(this.w, this.h) * 0.5,
    );
    wash.addColorStop(
      0,
      withAlpha(material.teal, this.theme === "dark" ? 0.1 : 0.065),
    );
    wash.addColorStop(
      0.55,
      withAlpha(material.crimson, this.theme === "dark" ? 0.035 : 0.025),
    );
    wash.addColorStop(1, withAlpha(material.background, 0));
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, this.w, this.h);

    this.drawFigures();

    // Wide, low-frequency market contours connect the entire stage without
    // competing with the copy column.
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.lineWidth = this.theme === "dark" ? 0.7 : 0.85;
    for (let row = 0; row < 8; row++) {
      ctx.beginPath();
      for (let x = -8; x <= this.w + 8; x += 8) {
        const u = x / this.w;
        const y =
          this.h * (0.13 + row * 0.105) +
          Math.sin(u * 5.4 + row * 0.68 + time * 0.12) * this.h * 0.024 +
          Math.sin(u * 13.2 - time * 0.16 + row) * this.h * 0.009;
        if (x < 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      const mix = row / 7;
      ctx.strokeStyle = withAlpha(
        mix < 0.5 ? material.tealSoft : material.crimsonSoft,
        this.theme === "dark" ? 0.095 : 0.12,
      );
      ctx.stroke();
    }

    // Sparse technical grid only around the machine, keeping text quiet.
    const gridLeft = this.mobile ? this.w * 0.43 : this.w * 0.54;
    const step = this.mobile ? 24 : 30;
    ctx.fillStyle = withAlpha(
      material.grid,
      this.theme === "dark" ? 0.13 : 0.16,
    );
    for (let y = step; y < this.h; y += step) {
      for (let x = gridLeft; x < this.w; x += step) {
        const fade = clamp((x - gridLeft) / (this.w - gridLeft));
        if (seeded(x + y * 3) > 0.27 + fade * 0.22) continue;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    ctx.restore();
  }

  private drawPaths(
    time: number,
    core: Point,
    radius: number,
    material: (typeof EXECUTION_CORE.theme)[ThemeMode],
  ) {
    const ctx = this.ctx;
    const paths = Array.from({ length: this.laneCount }, (_, index) =>
      this.pathPoints(PATHS[index], core, radius, index),
    );
    const radial = EXECUTION_CORE.paths.style === "radial";
    const fade = EXECUTION_CORE.paths.fade;

    // The dormant rails make the processing topology readable even between
    // pulses. In radial mode each rail is stroked with a gradient that runs
    // from transparent at its far end to full strength where it meets the
    // rings, so the fan deepens inward and dissolves before it can cut across
    // the headline.
    paths.forEach((path, index) => {
      const spec = PATHS[index];
      const color = this.pathIsBull(spec, index)
        ? material.tealSoft
        : material.crimsonSoft;
      const peak = radial
        ? EXECUTION_CORE.paths.railAlpha[this.theme]
        : this.theme === "dark"
          ? 0.18
          : 0.25;

      ctx.beginPath();
      ctx.moveTo(path.start.x, path.start.y);
      ctx.bezierCurveTo(
        path.c1.x,
        path.c1.y,
        path.c2.x,
        path.c2.y,
        path.end.x,
        path.end.y,
      );
      ctx.lineWidth = this.theme === "dark" ? 0.8 : 1;

      if (radial) {
        const grad = ctx.createLinearGradient(
          path.start.x,
          path.start.y,
          path.end.x,
          path.end.y,
        );
        grad.addColorStop(0, withAlpha(color, peak * fade.outer));
        grad.addColorStop(fade.kneeAt, withAlpha(color, peak * fade.knee));
        grad.addColorStop(1, withAlpha(color, peak));
        ctx.strokeStyle = grad;
      } else {
        ctx.strokeStyle = withAlpha(color, peak);
      }
      ctx.stroke();
    });

    for (const signal of this.signals) {
      const spec = PATHS[signal.lane];
      const path = paths[signal.lane];
      let progress = (signal.phase + time * signal.speed) % 1;
      // Signals accelerate as they are captured by the execution field.
      progress = 1 - (1 - progress) * (1 - progress * 0.28);
      const split = 0.72;
      let point: Point;
      // Signals ride the same ramp as the rail beneath them — faint at the far
      // end, brightening as they travel in — so a pulse is never left glowing
      // on a line that has already faded to nothing.
      let alpha = radial
        ? 0.06 +
          Math.pow(progress, EXECUTION_CORE.paths.signalFadeExponent) * 0.94
        : 0.25 + Math.sin(progress * Math.PI) * 0.75;

      if (signal.rejected && progress > split) {
        const join = cubic(path.start, path.c1, path.c2, path.end, split);
        const tangent = cubicTangent(
          path.start,
          path.c1,
          path.c2,
          path.end,
          split,
        );
        const length = Math.max(1, Math.hypot(tangent.x, tangent.y));
        const nx = (-tangent.y / length) * signal.branch;
        const ny = (tangent.x / length) * signal.branch;
        const branchProgress = (progress - split) / (1 - split);
        point = {
          x:
            join.x +
            (tangent.x / length) * branchProgress * radius * 0.65 +
            nx * branchProgress * radius * 0.62,
          y:
            join.y +
            (tangent.y / length) * branchProgress * radius * 0.65 +
            ny * branchProgress * radius * 0.62,
        };
        alpha *= 1 - branchProgress;
      } else {
        point = cubic(path.start, path.c1, path.c2, path.end, progress);
      }

      const color = this.pathIsBull(spec, signal.lane)
        ? material.teal
        : material.crimson;

      ctx.save();
      ctx.globalAlpha = clamp(alpha);
      if (this.theme === "dark") {
        ctx.shadowColor = color;
        ctx.shadowBlur = 5 * material.glow;
      }
      ctx.fillStyle = color;
      const size = signal.size * (this.mobile ? 0.85 : 1);
      ctx.translate(point.x, point.y);
      ctx.rotate(progress * Math.PI * 2);
      ctx.fillRect(-size, -size, size * 2, size * 2);
      ctx.restore();
    }
  }

  private drawOutputs(
    time: number,
    core: Point,
    radius: number,
    material: (typeof EXECUTION_CORE.theme)[ThemeMode],
  ) {
    const ctx = this.ctx;
    const lanes = [-0.34, 0, 0.34];
    lanes.forEach((angle, index) => {
      const start = {
        x: core.x + Math.cos(angle) * radius * 1.65,
        y: core.y + Math.sin(angle) * radius * 1.65,
      };
      const end = { x: this.w * 1.03, y: start.y + angle * radius * 0.55 };
      const c1 = { x: start.x + radius * 1.25, y: start.y };
      const c2 = { x: end.x - radius * 1.1, y: end.y };
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
      ctx.strokeStyle = withAlpha(
        material.teal,
        this.theme === "dark" ? 0.4 : 0.52,
      );
      ctx.lineWidth = index === 1 ? 1.35 : 0.8;
      ctx.stroke();

      for (let pulse = 0; pulse < 3; pulse++) {
        const t =
          (time * (0.17 + index * 0.012) + pulse / 3 + index * 0.13) % 1;
        const point = cubic(start, c1, c2, end, t);
        ctx.save();
        ctx.fillStyle = index === 1 ? material.neutral : material.teal;
        if (this.theme === "dark") {
          ctx.shadowColor = material.teal;
          ctx.shadowBlur = 8;
        }
        ctx.beginPath();
        ctx.arc(point.x, point.y, index === 1 ? 2.1 : 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
  }

  private drawRing(
    cx: number,
    cy: number,
    radius: number,
    segments: number,
    rotation: number,
    colorA: string,
    colorB: string,
    opacity: number,
    width: number,
  ) {
    const ctx = this.ctx;
    const slice = (Math.PI * 2) / segments;
    for (let i = 0; i < segments; i++) {
      if (i % 5 === 4) continue;
      const start = rotation + i * slice;
      ctx.beginPath();
      ctx.arc(
        cx,
        cy,
        radius,
        start,
        start + slice * (i % 3 === 0 ? 0.56 : 0.72),
      );
      ctx.strokeStyle = withAlpha(i % 4 === 0 ? colorB : colorA, opacity);
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  private drawCore(
    time: number,
    core: Point,
    radius: number,
    material: (typeof EXECUTION_CORE.theme)[ThemeMode],
  ) {
    const ctx = this.ctx;
    const motionTime = this.reduced ? 0 : time;
    const speed = EXECUTION_CORE.motion.ringSpeed;
    const breathe = 1 + Math.sin(motionTime * 0.9) * 0.018;

    ctx.save();
    if (this.theme === "dark") {
      const aura = ctx.createRadialGradient(
        core.x,
        core.y,
        radius * 0.2,
        core.x,
        core.y,
        radius * 2.45,
      );
      aura.addColorStop(0, withAlpha(material.teal, 0.16));
      aura.addColorStop(0.48, withAlpha(material.crimson, 0.045));
      aura.addColorStop(1, withAlpha(material.background, 0));
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(core.x, core.y, radius * 2.45, 0, Math.PI * 2);
      ctx.fill();
    }

    if (EXECUTION_CORE.showRings) {
      this.drawRing(
        core.x,
        core.y,
        radius * 1.7 * breathe,
        32,
        motionTime * speed,
        material.teal,
        material.crimson,
        this.theme === "dark" ? 0.48 : 0.62,
        1.05,
      );
      this.drawRing(
        core.x,
        core.y,
        radius * 1.38,
        22,
        -motionTime * speed * 1.4,
        material.crimson,
        material.neutral,
        this.theme === "dark" ? 0.5 : 0.66,
        1.35,
      );
      this.drawRing(
        core.x,
        core.y,
        radius * 1.1 * breathe,
        14,
        motionTime * speed * 0.72,
        material.teal,
        material.neutral,
        this.theme === "dark" ? 0.7 : 0.78,
        1.6,
      );
    }

    // Risk checkpoints orbit between the second and third gates, and ride the
    // scroll outward with the rails so the whole field breathes together.
    const orbit = radius * 1.24 * this.orbitExpansion();
    for (let i = 0; i < 6; i++) {
      const angle = i * (Math.PI / 3) - motionTime * 0.12;
      const x = core.x + Math.cos(angle) * orbit;
      const y = core.y + Math.sin(angle) * orbit;
      const accepted = i !== 1 && i !== 4;
      ctx.fillStyle = accepted ? material.teal : material.crimson;
      if (this.theme === "dark") {
        ctx.shadowColor = ctx.fillStyle as string;
        ctx.shadowBlur = 7;
      }
      ctx.beginPath();
      ctx.arc(x, y, accepted ? 2.5 : 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Centre emblem — switchable from EXECUTION_CORE.emblemKind.
    const emblem = EXECUTION_CORE.motion.emblem;
    const emblemPhase = (motionTime * Math.PI * 2) / emblem.cycleSeconds;
    const emblemBounce =
      Math.sin(emblemPhase) * radius * emblem.bounce +
      Math.sin(emblemPhase * 2) * radius * emblem.bounce * 0.18;
    const emblemScale = this.reduced
      ? 1
      : 1 + Math.sin(emblemPhase - Math.PI / 2) * emblem.scale;

    ctx.save();
    if (EXECUTION_CORE.emblemKind === "ribbon") {
      // The ribbon carries its own float — a slower, gentler one than the
      // generic emblem bounce, and it needs the untransformed centre for the
      // orbit rings. So it is translated but deliberately not scaled here.
      ctx.translate(core.x, core.y);
      this.drawRibbonEmblem(ctx, material, radius, motionTime);
    } else {
      ctx.translate(core.x, core.y + emblemBounce);
      ctx.scale(emblemScale, emblemScale);
      if (EXECUTION_CORE.emblemKind === "void") {
        this.drawVoidEmblem(ctx, material, radius, motionTime);
      } else if (EXECUTION_CORE.emblemKind === "aperture") {
        this.drawApertureEmblem(ctx, material, radius, motionTime);
      } else {
        this.drawCrossEmblem(ctx, material, radius, emblemPhase);
      }
    }
    ctx.restore();

    // Rotating scan arc — part of the ring furniture. Without the gates it
    // would sit inside the enlarged blades and read as a stray stroke.
    if (EXECUTION_CORE.showRings) {
      ctx.beginPath();
      ctx.arc(
        core.x,
        core.y,
        radius * 0.94,
        motionTime * 0.42,
        motionTime * 0.42 + Math.PI * 0.38,
      );
      ctx.strokeStyle = withAlpha(
        material.neutral,
        this.theme === "dark" ? 0.56 : 0.68,
      );
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Previous decision marker — a long vertical seam with shorter rotating
   * arms. Kept intact so EXECUTION_CORE.emblemKind can restore it.
   * Assumes the caller has already translated/scaled to the core.
   */
  private drawCrossEmblem(
    ctx: CanvasRenderingContext2D,
    material: (typeof EXECUTION_CORE.theme)[ThemeMode],
    radius: number,
    emblemPhase: number,
  ) {
    const armRotation =
      Math.sin(emblemPhase) * EXECUTION_CORE.motion.emblem.armRotation;
    const verticalHalf = radius * 0.43;
    const horizontalHalf = radius * 0.31;

    ctx.strokeStyle = material.decisionCross;
    ctx.lineWidth = Math.max(1.15, radius * 0.018);
    ctx.lineCap = "round";
    ctx.globalAlpha = this.theme === "dark" ? 0.86 : 0.9;
    if (this.theme === "dark") {
      ctx.shadowColor = material.decisionCross;
      ctx.shadowBlur = 4.5;
    } else {
      ctx.shadowColor = withAlpha(material.teal, 0.24);
      ctx.shadowBlur = 1.5;
    }

    ctx.beginPath();
    ctx.moveTo(0, -verticalHalf);
    ctx.lineTo(0, verticalHalf);
    ctx.stroke();

    ctx.rotate(armRotation);
    ctx.beginPath();
    ctx.moveTo(-horizontalHalf, 0);
    ctx.lineTo(horizontalHalf, 0);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = material.decisionCross;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1.1, radius * 0.025), 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * No symbol at all — the rails converge, are consumed, and the centre holds
   * a soft well with a single slowly-breathing rim. Nothing to recognise, so
   * nothing to date.
   * Assumes the caller has already translated/scaled to the core.
   */
  private drawVoidEmblem(
    ctx: CanvasRenderingContext2D,
    material: (typeof EXECUTION_CORE.theme)[ThemeMode],
    radius: number,
    time: number,
  ) {
    const dark = this.theme === "dark";
    const outer = radius * 1.05;

    const well = ctx.createRadialGradient(0, 0, 0, 0, 0, outer);
    if (dark) {
      well.addColorStop(0, "rgba(0,0,0,0.92)");
      well.addColorStop(0.7, "rgba(0,0,0,0.5)");
      well.addColorStop(1, "rgba(0,0,0,0)");
    } else {
      well.addColorStop(0, withAlpha(material.neutral, 0.17));
      well.addColorStop(0.7, withAlpha(material.neutral, 0.07));
      well.addColorStop(1, withAlpha(material.neutral, 0));
    }
    ctx.fillStyle = well;
    ctx.beginPath();
    ctx.arc(0, 0, outer, 0, Math.PI * 2);
    ctx.fill();

    const pulse = this.reduced ? 0.34 : 0.3 + 0.18 * Math.sin(time * 0.8);
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.46, 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(material.neutral, pulse);
    ctx.lineWidth = Math.max(1, radius * 0.012);
    ctx.stroke();
  }

  /**
   * Build the ribbon's geometry: centreline, per-sample normal and half-width.
   *
   * Cached on footprint. The shape never changes — only the lit arcs travel
   * along it — so this runs on mount and on resize, not per frame.
   *
   * The centreline integrates a tangent angle rather than interpolating
   * placed knots. See EXECUTION_CORE.ribbon for why: knots around a centre
   * close into an oval and read as a ring, whereas a tangent that races
   * through 2π inside one window produces a strip that folds over itself once
   * and leaves two open ends.
   */
  private ribbonGeometry(size: number) {
    if (this.ribbonGeom && this.ribbonGeom.size === size) {
      return this.ribbonGeom;
    }
    const strands =
      EXECUTION_CORE.ribbon.form === "mark"
        ? this.markStrands(size)
        : [this.curlStrand(size)];
    const geom = { size, strands };
    this.ribbonGeom = geom;
    return geom;
  }

  /**
   * Turn a centreline into a strip: unit normals from a central difference,
   * plus a half-width profile, so the two edges are centreline ± normal·half.
   */
  private buildStrand(
    line: Point[],
    halfWidth: (t: number) => number,
    tint: "cyan" | "crimson",
  ): RibbonStrand {
    const n = line.length - 1;
    const samples: RibbonSample[] = [];
    let length = 0;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = line[Math.max(0, i - 1)];
      const b = line[Math.min(n, i + 1)];
      const tx = b.x - a.x;
      const ty = b.y - a.y;
      const m = Math.hypot(tx, ty) || 1;
      samples.push({
        x: line[i].x,
        y: line[i].y,
        nx: -ty / m,
        ny: tx / m,
        half: halfWidth(t),
        t,
      });
      if (i > 0) {
        length += Math.hypot(line[i].x - line[i - 1].x, line[i].y - line[i - 1].y);
      }
    }
    return { samples, length, tint };
  }

  /** Uniform Catmull-Rom through the knots, with the ends duplicated. */
  private static spline(knots: readonly (readonly number[])[], count: number) {
    const p = [knots[0], ...knots, knots[knots.length - 1]];
    const out: Point[] = [];
    const segs = p.length - 3;
    const per = Math.max(2, Math.round(count / segs));
    for (let s = 0; s < segs; s++) {
      const [a, b, c, d] = [p[s], p[s + 1], p[s + 2], p[s + 3]];
      for (let k = 0; k < per; k++) {
        const t = k / per;
        const t2 = t * t;
        const t3 = t2 * t;
        out.push({
          x:
            0.5 *
            (2 * b[0] +
              (-a[0] + c[0]) * t +
              (2 * a[0] - 5 * b[0] + 4 * c[0] - d[0]) * t2 +
              (-a[0] + 3 * b[0] - 3 * c[0] + d[0]) * t3),
          y:
            0.5 *
            (2 * b[1] +
              (-a[1] + c[1]) * t +
              (2 * a[1] - 5 * b[1] + 4 * c[1] - d[1]) * t2 +
              (-a[1] + 3 * b[1] - 3 * c[1] + d[1]) * t3),
        });
      }
    }
    const last = knots[knots.length - 1];
    out.push({ x: last[0], y: last[1] });
    return out;
  }

  /**
   * The mark, as two suspended strips — the slanted stem and the chevron.
   *
   * Two strands rather than one continuous ribbon: the mark itself is two
   * separate pieces, and inventing a connector between them would change what
   * the form reads as. Apart, they read as sculpture rather than as a logo
   * laid flat.
   */
  private markStrands(size: number): RibbonStrand[] {
    const m = EXECUTION_CORE.ribbon.mark;
    const s = size * m.scale;
    const place = (knots: readonly (readonly number[])[]) =>
      HeroExecutionEngine.spline(knots, m.samples).map((q) => ({
        x: q.x * s,
        y: q.y * s,
      }));

    // The stem's apexes are points in the mark, so its strip tapers to
    // nothing at both ends rather than being cut off square.
    const stemHalf = (t: number) =>
      s * m.stemWidth * (0.1 + 0.9 * Math.sin(Math.PI * clamp(t)) ** 0.45);

    // The chevron keeps its cut ends but pinches at the fold, so the point
    // reads as ribbon turning through itself instead of a mitred corner.
    const chevHalf = (t: number) => {
      const fold =
        0.55 + 0.45 * (1 - Math.exp(-(((t - 0.5) / 0.14) ** 2) * 1.6));
      const end =
        t < 0.1 ? (t / 0.1) ** 0.5 : t > 0.9 ? ((1 - t) / 0.1) ** 0.5 : 1;
      return s * m.chevronWidth * fold * (0.45 + 0.55 * end);
    };

    return [
      this.buildStrand(place(m.stem), stemHalf, "cyan"),
      this.buildStrand(place(m.chevron), chevHalf, "crimson"),
    ];
  }

  /**
   * The abstract single folded strip. See EXECUTION_CORE.ribbon for why the
   * centreline integrates a tangent angle instead of interpolating placed
   * knots: knots around a centre close into an oval and read as a ring,
   * whereas a tangent that races through 2π inside one window produces a
   * strip that folds over itself once and leaves two open ends.
   */
  private curlStrand(size: number): RibbonStrand {
    const cfg = EXECUTION_CORE.ribbon;
    const p = cfg.path;
    const n = cfg.samples;

    const raw: Point[] = [];
    let x = 0;
    let y = 0;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const s = 1 / (1 + Math.exp(-(t - p.loopAt) / p.loopWidth));
      const phi =
        p.phi0 +
        p.sweep * t +
        p.wobble * Math.sin(Math.PI * 2 * p.wobbleFreq * t) +
        Math.PI * 2 * s;
      x += Math.cos(phi) / n;
      y += Math.sin(phi) / n;
      raw.push({ x, y });
    }

    // Fit to the footprint by the longer axis, centred on its own bounds.
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const q of raw) {
      if (q.x < minX) minX = q.x;
      if (q.x > maxX) maxX = q.x;
      if (q.y < minY) minY = q.y;
      if (q.y > maxY) maxY = q.y;
    }
    const scale = size / Math.max(maxX - minX, maxY - minY);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const line = raw.map((q) => ({
      x: (q.x - cx) * scale,
      y: (q.y - cy) * scale,
    }));

    // A strip, not a wire: the width pinches almost shut where the path folds
    // over itself, and again on the outgoing tail, so the form reads as ribbon
    // turning edge-on rather than as a stroked outline.
    const maxHalf = size * cfg.width;
    const half = (t: number) => {
      const fold = 0.2 + 0.8 * (1 - Math.exp(-(((t - 0.5) / 0.185) ** 2) * 1.7));
      const twist =
        0.45 + 0.55 * (1 - Math.exp(-(((t - 0.84) / 0.085) ** 2) * 1.7));
      const taper =
        t < 0.1 ? (t / 0.1) ** 0.6 : t > 0.9 ? ((1 - t) / 0.1) ** 0.6 : 1;
      return maxHalf * fold * twist * (0.34 + 0.66 * taper);
    };

    return this.buildStrand(line, half, "cyan");
  }

  /**
   * Liquid ribbon — one continuous folded strip suspended at the core.
   *
   * Layered, in painting order: a localised atmospheric glow (dark only), the
   * translucent body between the two edges, the two lit edges, and a faint
   * internal reflection that shifts with the tilt.
   *
   * Both lit edges are a single dashed stroke each with an animated
   * `lineDashOffset`, so an arc of light travels the path for two draw calls
   * rather than one per segment.
   *
   * Assumes the caller has translated to the core and applied no scale.
   */
  private drawRibbonEmblem(
    ctx: CanvasRenderingContext2D,
    material: (typeof EXECUTION_CORE.theme)[ThemeMode],
    radius: number,
    time: number,
  ) {
    const cfg = EXECUTION_CORE.ribbon;
    const tok = cfg.theme[this.theme];
    const dark = this.theme === "dark";
    const size = radius * (this.mobile ? cfg.mobileSize : cfg.size);
    const geom = this.ribbonGeometry(size);

    // Rings first: they revolve around the ribbon's resting centre, so they
    // must not inherit its float.
    if (cfg.orbits.enabled) this.drawRibbonOrbits(ctx, material, radius, time);

    // Float — brief: 8–12s, 4–6px, 2–4°, 0.985–1.015. Transform only.
    const phase = this.reduced ? 0 : (time * Math.PI * 2) / cfg.float.seconds;
    ctx.save();
    ctx.translate(0, Math.sin(phase) * radius * cfg.float.lift);
    ctx.rotate(Math.sin(phase * 0.8 + 0.7) * cfg.float.tilt);
    const breathe = 1 + Math.sin(phase * 1.15) * cfg.float.scale;
    ctx.scale(breathe, breathe);

    if (dark && tok.glow > 0) {
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.62);
      glow.addColorStop(0, withAlpha(material.teal, 0.1 * tok.glow));
      glow.addColorStop(0.55, withAlpha(material.crimson, 0.05 * tok.glow));
      glow.addColorStop(1, withAlpha(material.background, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }

    const travel = this.reduced ? 0.2 : (time * cfg.flow.speed) % 1;
    const weight = Math.max(1, size * 0.012);
    const slide = 0.18 + 0.3 * (0.5 + 0.5 * Math.sin(phase * 0.8 + 0.7));

    geom.strands.forEach((strand, index) => {
      const pts = strand.samples;
      const len = strand.length;

      // 1. Translucent body — down one edge and back along the other.
      //
      // The gradient leans toward the strand's own colour. In the mark form
      // that is the logo's split: the stem reads teal, the chevron crimson.
      ctx.beginPath();
      ctx.moveTo(
        pts[0].x + pts[0].nx * pts[0].half,
        pts[0].y + pts[0].ny * pts[0].half,
      );
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(
          pts[i].x + pts[i].nx * pts[i].half,
          pts[i].y + pts[i].ny * pts[i].half,
        );
      }
      for (let i = pts.length - 1; i >= 0; i--) {
        ctx.lineTo(
          pts[i].x - pts[i].nx * pts[i].half,
          pts[i].y - pts[i].ny * pts[i].half,
        );
      }
      ctx.closePath();
      const lead = strand.tint === "cyan" ? tok.cyan : tok.crimson;
      const trail = strand.tint === "cyan" ? tok.crimson : tok.cyan;
      const bodyFill = ctx.createLinearGradient(
        -size / 2,
        -size / 2,
        size / 2,
        size / 2,
      );
      bodyFill.addColorStop(0, withAlpha(lead, tok.bodyAlpha * 0.9));
      bodyFill.addColorStop(0.55, withAlpha(tok.body, tok.bodyAlpha));
      bodyFill.addColorStop(1, withAlpha(trail, tok.bodyAlpha * 0.6));
      ctx.fillStyle = bodyFill;
      ctx.fill();

      // 2. The two lit edges. One dashed stroke each with an animated dash
      // offset, so an arc of light travels the path for two draw calls
      // instead of one per segment.
      const dash = len * cfg.flow.arc;
      const edge = (
        side: 1 | -1,
        colour: string,
        phaseOffset: number,
        lineWeight: number,
      ) => {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const q = pts[i];
          const ex = q.x + side * q.nx * q.half;
          const ey = q.y + side * q.ny * q.half;
          if (i === 0) ctx.moveTo(ex, ey);
          else ctx.lineTo(ex, ey);
        }
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.setLineDash([]);
        ctx.lineWidth = lineWeight * 0.8;
        ctx.strokeStyle = withAlpha(colour, tok.edgeAlpha * 0.3);
        ctx.stroke();

        ctx.setLineDash([dash, len - dash]);
        ctx.lineDashOffset = -((travel + phaseOffset) % 1) * len;
        ctx.lineWidth = lineWeight;
        ctx.strokeStyle = withAlpha(colour, tok.edgeAlpha);
        if (dark) {
          ctx.shadowColor = withAlpha(colour, 0.5);
          ctx.shadowBlur = 4;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([]);
      };

      // Offsetting the second strand keeps the two from pulsing in lockstep,
      // which would read as one flashing object rather than two.
      const stagger = index * 0.37;
      edge(1, tok.cyan, stagger, weight);
      edge(-1, tok.crimson, cfg.flow.offset + stagger, weight * 0.82);

      // 3. Internal reflection — rides just inside the body and slides across
      // it as the ribbon tilts, which gives the strip a readable surface.
      if (!this.mobile) {
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const q = pts[i];
          const off = q.half * (slide * 2 - 1) * 0.72;
          const rx = q.x + q.nx * off;
          const ry = q.y + q.ny * off;
          if (i === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.setLineDash([len * 0.22, len * 0.78]);
        ctx.lineDashOffset = -((travel * 0.6 + 0.15 + stagger) % 1) * len;
        ctx.lineWidth = Math.max(0.7, size * 0.006);
        ctx.strokeStyle = withAlpha(tok.reflection, tok.reflectionAlpha);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    ctx.restore();
  }

  /**
   * Two faint rings revolving around the ribbon. They ride `orbitExpansion()`
   * so they widen and close with the rail field as the page scrolls, rather
   * than being a second, unrelated motion.
   *
   * Assumes the caller has translated to the core.
   */
  private drawRibbonOrbits(
    ctx: CanvasRenderingContext2D,
    material: (typeof EXECUTION_CORE.theme)[ThemeMode],
    radius: number,
    time: number,
  ) {
    const cfg = EXECUTION_CORE.ribbon;
    const tok = cfg.theme[this.theme];
    const spread = radius * this.orbitExpansion();
    const spin = this.reduced ? 0 : time;

    ctx.save();
    ctx.lineWidth = Math.max(0.7, radius * 0.009);

    ctx.setLineDash([radius * 0.05, radius * 0.075]);
    ctx.strokeStyle = withAlpha(material.neutral, tok.orbit);
    ctx.beginPath();
    ctx.ellipse(
      0,
      0,
      spread * 1.62,
      spread * 0.68,
      spin * cfg.orbits.spin,
      0,
      Math.PI * 2,
    );
    ctx.stroke();

    // The second ring is dropped on phones, where it only adds clutter.
    if (!this.mobile) {
      ctx.setLineDash([]);
      ctx.strokeStyle = withAlpha(material.neutral, tok.orbit * 0.66);
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        spread * 1.05,
        spread * 1.28,
        spin * cfg.orbits.counterSpin,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  /**
   * Read the live signal stream for arrivals.
   *
   * Accepted signals peak as they land on the core; rejected ones peak just
   * past the branch point where they fork away. Both are continuous functions
   * of the same phase maths `drawPaths` uses, so the iris is driven by what is
   * actually on screen rather than by a parallel timer that could drift.
   */
  private aperturePressure(time: number) {
    let accept = 0;
    let reject = 0;
    for (const signal of this.signals) {
      let progress = (signal.phase + time * signal.speed) % 1;
      progress = 1 - (1 - progress) * (1 - progress * 0.28);
      if (signal.rejected) {
        const d = Math.abs(progress - 0.8);
        if (d < 0.08) reject += 1 - d / 0.08;
      } else {
        const d = Math.abs(progress - 0.97);
        if (d < 0.06) accept += 1 - d / 0.06;
      }
    }
    return { accept, reject };
  }

  /**
   * Mechanical iris. Blades open as accepted signals land and bite shut as
   * rejected ones branch away — so the converging paths resolve into a verdict
   * instead of terminating on a static marker.
   * Assumes the caller has already translated/scaled to the core.
   */
  private drawApertureEmblem(
    ctx: CanvasRenderingContext2D,
    material: (typeof EXECUTION_CORE.theme)[ThemeMode],
    radius: number,
    time: number,
  ) {
    const cfg = EXECUTION_CORE.motion.aperture;
    const { accept, reject } = this.aperturePressure(time);
    const scale = cfg.pressureScale;
    const target =
      cfg.restOpen +
      Math.min(1, accept / scale) * cfg.openBoost -
      Math.min(1, reject / scale) * cfg.closeBite;

    // Heavier than a raw follow, so the mechanism reads as having mass.
    this.apertureOpen +=
      (Math.max(0.12, Math.min(0.95, target)) - this.apertureOpen) *
      (this.reduced ? 1 : cfg.responseLerp);

    const dark = this.theme === "dark";
    const outer = radius * cfg.outer;
    const inner = outer * this.apertureOpen;
    const spin = this.reduced ? 0 : time * cfg.spin;
    const step = (Math.PI * 2) / cfg.blades;

    for (let i = 0; i < cfg.blades; i++) {
      const a0 = i * step + spin;
      const a1 = a0 + step;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a0) * outer, Math.sin(a0) * outer);
      ctx.lineTo(Math.cos(a1) * outer, Math.sin(a1) * outer);
      ctx.lineTo(Math.cos(a1) * inner, Math.sin(a1) * inner);
      ctx.lineTo(Math.cos(a0) * inner, Math.sin(a0) * inner);
      ctx.closePath();

      // Alternating faces catch the light differently, as milled blades would.
      const lit = i % 2 === 0;
      ctx.fillStyle = withAlpha(
        lit ? material.neutral : material.grid,
        dark ? (lit ? 0.2 : 0.13) : lit ? 0.3 : 0.2,
      );
      ctx.fill();
      ctx.strokeStyle = withAlpha(material.neutral, dark ? 0.42 : 0.5);
      ctx.lineWidth = Math.max(0.8, radius * 0.008);
      ctx.stroke();
    }

    // The rim carries the verdict: teal when opening, crimson when biting shut.
    const verdict =
      accept > reject
        ? material.teal
        : reject > accept
          ? material.crimson
          : material.neutral;
    const heat = Math.min(1, Math.max(accept, reject) / scale);

    ctx.beginPath();
    ctx.arc(0, 0, inner, 0, Math.PI * 2);
    ctx.strokeStyle = withAlpha(verdict, 0.5 + heat * 0.45);
    ctx.lineWidth = Math.max(1.1, radius * 0.016);
    ctx.stroke();

    if (dark && heat > 0.02) {
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, inner * 2.6);
      glow.addColorStop(0, withAlpha(verdict, 0.26 * heat));
      glow.addColorStop(1, withAlpha(verdict, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, inner * 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private render(time: number) {
    if (!this.w || !this.h) return;
    const material = EXECUTION_CORE.theme[this.theme];
    const geometry = this.geometry();
    const core = { x: geometry.x, y: geometry.y };
    const depth = EXECUTION_CORE.motion.depth;
    const driftScale = this.mobile ? 2 : 1;
    const driftPhase = (time * Math.PI * 2) / depth.driftSeconds;
    const driftX = this.reduced ? 0 : Math.sin(driftPhase);
    const driftY = this.reduced ? 0 : Math.cos(driftPhase * 0.91);
    const gridOffset = {
      x: this.depth.x * depth.grid.x + driftX * depth.grid.drift * driftScale,
      y:
        this.depth.y * depth.grid.y +
        driftY * depth.grid.drift * 0.7 * driftScale,
    };
    const networkOffset = {
      x:
        this.depth.x * depth.network.x +
        driftX * depth.network.drift * driftScale,
      y:
        this.depth.y * depth.network.y +
        driftY * depth.network.drift * 0.7 * driftScale,
    };
    const coreOffset = {
      x: -this.depth.x * depth.core.x - driftX * depth.core.drift * driftScale,
      y:
        -this.depth.y * depth.core.y -
        driftY * depth.core.drift * 0.7 * driftScale,
    };
    const shiftedCore = {
      x: core.x + coreOffset.x,
      y: core.y + coreOffset.y,
    };

    this.ctx.save();
    this.ctx.globalCompositeOperation = "source-over";
    this.drawBackground(time, material, gridOffset);
    this.ctx.save();
    this.ctx.translate(networkOffset.x, networkOffset.y);
    this.drawPaths(time, core, geometry.radius, material);
    if (EXECUTION_CORE.outputs.enabled) {
      this.drawOutputs(time, core, geometry.radius, material);
    }
    this.ctx.restore();
    this.drawCore(time, shiftedCore, geometry.radius, material);
    this.ctx.restore();
  }
}
