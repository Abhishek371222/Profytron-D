/**
 * Hero particle engine — framework-free.
 *
 * The bull and bear are rebuilt from public/hero/{bull,bear}.png by sampling
 * every pixel that clears an alpha/brightness floor. Nothing is drawn by hand:
 * shape, musculature, rim light and colour all come from the artwork.
 *
 * Everything composites into a single ImageData buffer — background layers and
 * particles alike. Nothing uses canvas draw calls plus getImageData, because
 * that readback costs several milliseconds a frame.
 *
 * Two materials, one sculpture:
 *   dark  — particles ADD light to a near-black ground, so overlaps bloom
 *   light — the same particles lay dense teal/oxblood ink over cool paper,
 *           supported by a stippled alpha-mask underprint.
 *
 * Inert until start() is called, keeping it clear of the LCP window.
 */

import {
  LAYERS,
  LAYOUT,
  LIGHT_LINE_INK,
  MOBILE_LAYOUT,
  SCROLL,
  THEME,
  TUNING,
} from './hero-scene-config';

type Particle = {
  side: 0 | 1;
  u: number;
  v: number;
  /** Source colour, straight from the artwork. */
  r: number;
  g: number;
  b: number;
  a: number;
  /** Source luminance, cached for the ink transform. */
  lum: number;
  /** Render colour for the active theme. */
  cr: number;
  cg: number;
  cb: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  k: number;
  seed: number;
};

type EdgePoint = { side: 0 | 1; u: number; v: number; m: number };
type CoveragePoint = { side: 0 | 1; u: number; v: number; a: number; lum: number };
type Source = { img: HTMLImageElement; w: number; h: number };
type Transform = { x0: number; y0: number; dw: number; dh: number };

export type ThemeMode = 'dark' | 'light';

export class HeroParticleEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private reduced: boolean;

  private w = 0;
  private h = 0;
  private mobile = false;

  /** Approved cropped busts, shared by both theme materials. */
  private sources: Source[] = [];

  private particles: Particle[] = [];
  private bodyPoints: Particle[] = [];
  private coveragePoints: CoveragePoint[] = [];
  private edges: EdgePoint[] = [];
  private transforms: Transform[] = [];

  private frameBuf: ImageData | null = null;
  /** Complete pre-rendered grounds; theme changes swap between them. */
  private baseDark: Uint8ClampedArray | null = null;
  private baseLight: Uint8ClampedArray | null = null;

  private theme: ThemeMode = 'dark';
  private themeObserver: MutationObserver | null = null;

  private raf = 0;
  private t = 0;
  private assembledAt = -999;
  private startedAt = 0;
  private running = false;
  private frozen = false;
  private scrollProgress = 0;
  private resizeTimer = 0;
  private pointer = { x: -9999, y: -9999, active: false };

  private onResize = () => {
    window.clearTimeout(this.resizeTimer);
    this.resizeTimer = window.setTimeout(() => this.resize(), 180);
  };

  private onThemeChange = (event: Event) => {
    const mode = (event as CustomEvent<{ theme?: ThemeMode }>).detail?.theme;
    if (mode === 'dark' || mode === 'light') this.setTheme(mode);
  };

  /**
   * Tracked on `window`, not the canvas: the canvas sits behind the headline
   * and CTAs with pointer-events disabled, so it never receives its own events.
   */
  private onPointerMove = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) {
      this.pointer.active = false;
      return;
    }
    this.pointer.x = x * (this.w / r.width);
    this.pointer.y = y * (this.h / r.height);
    this.pointer.active = true;
  };

  /**
   * Scroll drives "converge": the creatures lean toward each other as the hero
   * exits. Cheap enough to read the rect directly — we only ever write canvas
   * pixels, so this can't thrash layout.
   */
  private onScroll = () => {
    if (!SCROLL.enabled) return;
    const r = this.canvas.getBoundingClientRect();
    if (!r.height) return;
    const p = -r.top / r.height;
    this.scrollProgress = p < 0 ? 0 : p > 1 ? 1 : p;
    // Frozen phones and reduced-motion scenes repaint only on direct input.
    if (this.frozen || this.reduced) this.render();
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2d context unavailable');
    this.ctx = ctx;
    this.reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.theme = HeroParticleEngine.detectTheme();
  }

  /** The site toggles a `dark` class on <html>; mirror that. */
  private static detectTheme(): ThemeMode {
    if (typeof document === 'undefined') return 'dark';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  async load(srcs: { bull: string; bear: string }) {
    const one = (src: string) =>
      new Promise<HTMLImageElement | null>((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });

    const pack = (imgs: (HTMLImageElement | null)[]): Source[] =>
      imgs
        .filter((i): i is HTMLImageElement => !!i)
        .map((img) => ({ img, w: img.naturalWidth, h: img.naturalHeight }));

    const [bull, bear] = await Promise.all([one(srcs.bull), one(srcs.bear)]);

    this.sources = pack([bull, bear]);
    this.edges = this.traceEdges(this.sources);
  }

  // ------------------------------------------------------------- sampling

  private sampleParticles() {
    this.sampleBody();
    this.particles = this.bodyPoints;
    this.assemble();
  }

  /**
   * Preserve dark's exact bright-pixel particle sampling. A second, coarser
   * alpha-mask sample supplies mass underneath those same particles on paper.
   */
  private sampleBody() {
    this.bodyPoints = [];
    this.coveragePoints = [];
    if (!this.sources.length) return;

    const stride = this.mobile
      ? MOBILE_LAYOUT.stride
      : this.w < 760
        ? TUNING.strideSmall
        : TUNING.stride;

    const off = document.createElement('canvas');
    const octx = off.getContext('2d', { willReadFrequently: true });
    if (!octx) return;

    this.sources.forEach((s, side) => {
      off.width = s.w;
      off.height = s.h;
      octx.clearRect(0, 0, s.w, s.h);
      octx.drawImage(s.img, 0, 0);

      let data: Uint8ClampedArray;
      try {
        data = octx.getImageData(0, 0, s.w, s.h).data;
      } catch {
        return;
      }

      const coverageStride = this.mobile
        ? Math.max(MOBILE_LAYOUT.stride, TUNING.lightCoverageStride)
        : TUNING.lightCoverageStride;
      for (let y = 0; y < s.h; y += coverageStride) {
        for (let x = 0; x < s.w; x += coverageStride) {
          const i = (y * s.w + x) * 4;
          const a = data[i + 3];
          if (a < TUNING.lightCoverageMinAlpha) continue;
          const lum =
            0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          this.coveragePoints.push({
            side: side as 0 | 1,
            u: x / s.w,
            v: y / s.h,
            a: a / 255,
            lum,
          });
        }
      }

      for (let y = 0; y < s.h; y += stride) {
        for (let x = 0; x < s.w; x += stride) {
          const i = (y * s.w + x) * 4;
          const a = data[i + 3];
          if (a < TUNING.minAlpha) continue;

          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          if (lum < TUNING.minLuma) continue;

          this.bodyPoints.push({
            side: side as 0 | 1,
            u: x / s.w,
            v: y / s.h,
            r,
            g,
            b,
            a: (a / 255) * TUNING.creatureOpacity,
            lum,
            cr: r,
            cg: g,
            cb: b,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            k: 0.05 + Math.random() * 0.05,
            seed: Math.random(),
          });
        }
      }
    });
  }

  /**
   * Sobel edge trace, once per asset — independent of canvas size, so it never
   * needs recomputing on resize.
   */
  private traceEdges(sources: Source[]): EdgePoint[] {
    const out: EdgePoint[] = [];
    const off = document.createElement('canvas');
    const octx = off.getContext('2d', { willReadFrequently: true });
    if (!octx) return out;

    const { threshold, stride } = LAYERS.lineArt;

    sources.forEach((s, side) => {
      off.width = s.w;
      off.height = s.h;
      octx.clearRect(0, 0, s.w, s.h);
      octx.drawImage(s.img, 0, 0);

      let data: Uint8ClampedArray;
      try {
        data = octx.getImageData(0, 0, s.w, s.h).data;
      } catch {
        return;
      }

      // premultiplied luminance so the alpha boundary reads as an edge too
      const lum = new Float32Array(s.w * s.h);
      for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        lum[p] =
          (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) *
          (data[i + 3] / 255);
      }

      for (let y = 1; y < s.h - 1; y += stride) {
        for (let x = 1; x < s.w - 1; x += stride) {
          const o = y * s.w + x;
          const gx =
            -lum[o - s.w - 1] - 2 * lum[o - 1] - lum[o + s.w - 1] +
            lum[o - s.w + 1] + 2 * lum[o + 1] + lum[o + s.w + 1];
          const gy =
            -lum[o - s.w - 1] - 2 * lum[o - s.w] - lum[o - s.w + 1] +
            lum[o + s.w - 1] + 2 * lum[o + s.w] + lum[o + s.w + 1];
          const m = Math.sqrt(gx * gx + gy * gy);
          if (m > threshold) {
            out.push({
              side: side as 0 | 1,
              u: x / s.w,
              v: y / s.h,
              m: Math.min(1, m / 320),
            });
          }
        }
      }
    });
    return out;
  }

  // --------------------------------------------------------------- theming

  setTheme(mode: ThemeMode) {
    if (mode === this.theme) return;
    this.theme = mode;
    // The document View Transition owns the reveal. Paint its destination
    // synchronously so the new snapshot never captures an in-between canvas.
    this.render();
    this.resume();
  }

  // -------------------------------------------------------------- geometry

  /** Throw every particle off-stage so the form builds itself back in. */
  assemble() {
    this.assembledAt = this.t;
    for (const p of this.particles) {
      p.x = (p.side === 0 ? -0.15 : 1.15) * this.w + (Math.random() - 0.5) * this.w * 0.3;
      p.y = this.h + Math.random() * this.h * 0.7;
      p.vx = 0;
      p.vy = 0;
    }
  }

  /** Geometry shared by both materials; dark's signed-off arrangement is fixed. */
  private buildTransforms(sources: Source[]): Transform[] {
    const converge = SCROLL.enabled ? this.scrollProgress * SCROLL.converge : 0;
    const rise = SCROLL.enabled ? this.scrollProgress * SCROLL.lift : 0;

    return sources.map((s, side): Transform => {
      if (this.mobile) {
        // Corner-anchored: bull rides high on the left, bear sits low on the
        // right, so the single-column copy runs between them rather than over
        // either one.
        const dh = Math.min(this.h * 0.6, this.w * MOBILE_LAYOUT.heightOfWidth);
        const dw = (s.w / s.h) * dh;
        const bleed = dw * MOBILE_LAYOUT.bleed;
        const x0 =
          side === 0
            ? -bleed + converge * dw
            : this.w - dw + bleed - converge * dw;
        const y0 =
          side === 0
            ? this.h * MOBILE_LAYOUT.bullTopBias - dh * 0.5 - this.h * rise
            : this.h - dh + dh * LAYOUT.floorLift - this.h * rise;
        return { x0, y0, dw, dh };
      }

      const dh = Math.min(
        this.h * LAYOUT.heightOfStage,
        this.w * LAYOUT.heightOfWidth,
      );
      const dw = (s.w / s.h) * dh;
      const inset = this.w * LAYOUT.inset;
      const x0 =
        side === 0 ? inset + converge * dw : this.w - dw - inset - converge * dw;
      const y0 = this.h - dh + dh * LAYOUT.floorLift - this.h * rise;
      return { x0, y0, dw, dh };
    });
  }

  private updateTransforms() {
    this.transforms = this.buildTransforms(this.sources);
  }

  /**
   * The stage. Flat near-black for dark; for light, paper plus a static teal
   * wash at the bull's edge and crimson at the bear's, so the ink sits in a
   * field that explains it rather than floating on neutral grey.
   *
   * Computed once per resize, never per frame.
   */
  /**
   * Both grounds are pre-rendered. Theme changes swap buffers instead of
   * mixing the entire viewport through a muddy grey midpoint.
   */
  private rebuildBase() {
    if (!this.frameBuf) return;
    const len = this.frameBuf.data.length;
    const w = this.w;
    const h = this.h;

    const dark = new Uint8ClampedArray(len);
    const [dr, dg, db] = THEME.dark.background;
    for (let i = 0; i < len; i += 4) {
      dark[i] = dr;
      dark[i + 1] = dg;
      dark[i + 2] = db;
      dark[i + 3] = 255;
    }
    this.baseDark = dark;

    const light = new Uint8ClampedArray(len);
    const [lr, lg, lb] = THEME.light.background;
    const { teal, crimson, strength } = THEME.light.wash;
    for (let y = 0; y < h; y++) {
      const fy = (y / h - 0.55) * 1.5;
      for (let x = 0; x < w; x++) {
        const u = x / w;
        const dl = Math.min(1, Math.hypot(u / 0.42, fy));
        const drr = Math.min(1, Math.hypot((1 - u) / 0.42, fy));
        const wl = (1 - dl) * (1 - dl) * strength;
        const wr = (1 - drr) * (1 - drr) * strength * 0.85;
        const o = (y * w + x) * 4;
        light[o] = lr + (teal[0] - lr) * wl + (crimson[0] - lr) * wr;
        light[o + 1] = lg + (teal[1] - lg) * wl + (crimson[1] - lg) * wr;
        light[o + 2] = lb + (teal[2] - lb) * wl + (crimson[2] - lb) * wr;
        light[o + 3] = 255;
      }
    }
    this.baseLight = light;
  }

  /** Lay down the complete ground for the active material. */
  private paintGround(d: Uint8ClampedArray) {
    const base = this.theme === 'light' ? this.baseLight : this.baseDark;
    if (base) d.set(base);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    this.mobile = window.matchMedia(
      `(max-width: ${MOBILE_LAYOUT.breakpoint}px)`,
    ).matches;

    const scale = Math.min(
      1,
      TUNING.maxCanvasWidth / rect.width,
      TUNING.maxCanvasHeight / rect.height,
    );
    this.w = Math.max(1, Math.round(rect.width * scale));
    this.h = Math.max(1, Math.round(rect.height * scale));
    this.canvas.width = this.w;
    this.canvas.height = this.h;

    this.frameBuf = this.ctx.createImageData(this.w, this.h);
    this.rebuildBase();

    this.sampleParticles();
    this.updateTransforms();
    this.onScroll();

    // A stopped loop would otherwise leave the resized buffer blank.
    if (this.frozen || this.reduced) {
      this.settle();
      this.render();
    }
  }

  private settle() {
    this.updateTransforms();
    for (const p of this.particles) {
      const T = this.transforms[p.side];
      if (!T) continue;
      p.x = T.x0 + p.u * T.dw;
      p.y = T.y0 + p.v * T.dh;
      p.vx = 0;
      p.vy = 0;
    }
  }

  // -------------------------------------------------------------- rendering

  /** Add light — the dark theme's blend. */
  private plotAdd(
    d: Uint8ClampedArray,
    o: number,
    r: number,
    g: number,
    b: number,
    weight: number,
  ) {
    const rr = r * weight;
    const gg = g * weight;
    const bb = b * weight;
    d[o] = d[o] + rr > 255 ? 255 : d[o] + rr;
    d[o + 1] = d[o + 1] + gg > 255 ? 255 : d[o + 1] + gg;
    d[o + 2] = d[o + 2] + bb > 255 ? 255 : d[o + 2] + bb;
  }

  /** Lay ink down — the light theme's blend. Additive is invisible on paper. */
  private plotInk(
    d: Uint8ClampedArray,
    o: number,
    r: number,
    g: number,
    b: number,
    weight: number,
  ) {
    const a = weight > 1 ? 1 : weight;
    if (a <= 0) return;
    d[o] = d[o] + (r - d[o]) * a;
    d[o + 1] = d[o + 1] + (g - d[o + 1]) * a;
    d[o + 2] = d[o + 2] + (b - d[o + 2]) * a;
  }

  /**
   * Flowing price-curve bands across the empty upper-centre.
   * Runs in BOTH themes — glowing over the dark ground, drawn as ink on paper.
   */
  private drawContours(d: Uint8ClampedArray) {
    const cfg = LAYERS.contours;
    if (!cfg.enabled) return;
    const w = this.w;
    const h = this.h;
    const light = this.theme === 'light';

    for (let band = 0; band < cfg.count; band++) {
      const yBase = h * (cfg.top + band * cfg.spacing);
      for (let x = 0; x < w; x++) {
        const u = x / w;
        const y =
          yBase +
          Math.sin(u * 5 + this.t * 0.25 + band * 0.6) * h * 0.045 +
          Math.sin(u * 13 - this.t * 0.4 + band) * h * 0.017;
        const yi = y | 0;
        if (yi < 0 || yi >= h - 1) continue;

        // fade toward the centre so the headline keeps a clean field
        const edge = Math.abs(u - 0.5) * 2;
        const alpha =
          (light ? cfg.lightOpacity : cfg.opacity) * (0.35 + edge * 0.65);
        const frac = y - yi;
        const o0 = (yi * w + x) * 4;
        const o1 = ((yi + 1) * w + x) * 4;

        if (!light) {
          // teal on the left, crimson on the right
          const r = 79 + (217 - 79) * u;
          const g = 195 + (87 - 195) * u;
          const b = 217 + (90 - 217) * u;
          this.plotAdd(d, o0, r, g, b, alpha * (1 - frac));
          this.plotAdd(d, o1, r, g, b, alpha * frac);
        } else {
          const ink = LIGHT_LINE_INK;
          const r = ink.bull[0] + (ink.bear[0] - ink.bull[0]) * u;
          const g = ink.bull[1] + (ink.bear[1] - ink.bull[1]) * u;
          const b = ink.bull[2] + (ink.bear[2] - ink.bull[2]) * u;
          this.plotInk(d, o0, r, g, b, alpha * (1 - frac));
          this.plotInk(d, o1, r, g, b, alpha * frac);
        }
      }
    }
  }

  /**
   * Sobel-traced creature outlines, oversized and lifted — the ghost that
   * expands and contracts behind each creature.
   *
   * Runs in both themes against the shared sculpture geometry.
   */
  private drawLineArt(
    d: Uint8ClampedArray,
    edges: EdgePoint[],
    transforms: Transform[],
    ink: boolean,
  ) {
    const cfg = LAYERS.lineArt;
    if (!cfg.enabled || !edges.length) return;
    const w = this.w;
    const h = this.h;
    const style = ink ? cfg.light : cfg;

    // Scale breathes per side, in opposite phase, so the two ghosts expand and
    // contract against each other rather than in unison.
    const breathe: number[] = [0, 1].map(
      (side) =>
        style.scale +
        Math.sin(this.t * cfg.breatheSpeed + side * Math.PI) *
          style.scaleBreathe,
    );

    for (let i = 0; i < edges.length; i++) {
      const e = edges[i];
      const T = transforms[e.side];
      if (!T) continue;

      const s = breathe[e.side];
      const cw = T.dw * s;
      const ch = T.dh * s;
      const cx = T.x0 + T.dw / 2 - cw / 2;
      const cy = T.y0 + T.dh / 2 - ch / 2 - h * style.lift;

      const x = (cx + e.u * cw) | 0;
      const y = (cy + e.v * ch) | 0;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;

      // Fade tracks the expansion — widest is faintest, so it reads as a
      // shadow breathing outward rather than a static outline blinking.
      const phase = Math.sin(this.t * cfg.breatheSpeed + e.side * Math.PI);
      const pulse = 1 - style.pulseDepth * (0.5 + 0.5 * phase);
      const alpha = e.m * style.opacity * pulse;
      const o = (y * w + x) * 4;

      if (ink) {
        const c = e.side === 0 ? LIGHT_LINE_INK.bull : LIGHT_LINE_INK.bear;
        this.plotInk(d, o, c[0], c[1], c[2], alpha);
      } else {
        const r = e.side === 0 ? 79 : 217;
        const g = e.side === 0 ? 195 : 87;
        const b = e.side === 0 ? 217 : 90;
        this.plotAdd(d, o, r, g, b, alpha);
      }
    }
  }

  /** Stippled alpha-mask support that gives the light sculpture visual mass. */
  private drawLightUnderprint(d: Uint8ClampedArray) {
    const w = this.w;
    const h = this.h;

    for (let i = 0; i < this.coveragePoints.length; i++) {
      const p = this.coveragePoints[i];
      const T = this.transforms[p.side];
      if (!T) continue;
      const x = (T.x0 + p.u * T.dw) | 0;
      const y = (T.y0 + p.v * T.dh) | 0;
      if (x < 0 || y < 0 || x >= w - 1 || y >= h - 1) continue;

      const ink = p.side === 0 ? THEME.light.ink.bull : THEME.light.ink.bear;
      const opacity =
        p.side === 0
          ? THEME.light.underprintOpacity.bull
          : THEME.light.underprintOpacity.bear;
      const shadowWeight = 0.72 + (1 - p.lum / 255) * 0.28;
      const alpha = p.a * opacity * shadowWeight;
      const o = (y * w + x) * 4;
      this.plotInk(d, o, ink[0], ink[1], ink[2], alpha);
      this.plotInk(d, o + 4, ink[0], ink[1], ink[2], alpha * 0.28);
      this.plotInk(
        d,
        ((y + 1) * w + x) * 4,
        ink[0],
        ink[1],
        ink[2],
        alpha * 0.22,
      );
    }
  }

  /** One sculpture rendered with the complete material for the active theme. */
  private render() {
    const buf = this.frameBuf;
    if (!buf) return;

    const d = buf.data;
    this.paintGround(d);
    this.updateTransforms();

    const light = this.theme === 'light';
    this.drawContours(d);
    this.drawLineArt(d, this.edges, this.transforms, light);
    if (light) this.drawLightUnderprint(d);

    if (this.particles.length && this.transforms.length) {
      const age = this.t - this.assembledAt;
      const pr2 = TUNING.pointerRadius * TUNING.pointerRadius;
      const px = this.pointer.x;
      const py = this.pointer.y;
      const pointerOn = this.pointer.active && !this.mobile;
      const drift = this.reduced
        ? 0
        : light
          ? THEME.light.drift
          : THEME.dark.drift;
      const pointerForce = light
        ? THEME.light.pointerForce
        : TUNING.pointerForce;
      const t = this.t;
      const w = this.w;
      const h = this.h;
      const bloom = TUNING.bloom;
      const mingle = SCROLL.enabled
        ? this.scrollProgress * SCROLL.intermingle
        : 0;

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const T = this.transforms[p.side];
        if (!T) continue;

        // particles nearest the facing edge drift further in, so the two
        // clouds begin to interleave rather than sliding as rigid blocks
        const facing = p.side === 0 ? p.u : 1 - p.u;
        let tx = T.x0 + p.u * T.dw + (p.side === 0 ? 1 : -1) * facing * mingle * T.dw;
        let ty = T.y0 + p.v * T.dh;

        if (drift > 0) {
          tx += Math.sin(t * 0.8 + p.seed * 30) * drift;
          ty += Math.cos(t * 0.7 + p.seed * 27) * drift;
        }

        const k = age < p.seed * 0.9 ? 0.012 : p.k;
        p.vx += (tx - p.x) * k;
        p.vy += (ty - p.y) * k;

        if (pointerOn) {
          const dx = p.x - px;
          const dy = p.y - py;
          const d2 = dx * dx + dy * dy;
          if (d2 < pr2 && d2 > 0.5) {
            const f = (pr2 - d2) / pr2;
            const inv = 1 / Math.sqrt(d2);
            p.vx += dx * inv * f * pointerForce;
            p.vy += dy * inv * f * pointerForce;
          }
        }

        p.vx *= 0.82;
        p.vy *= 0.82;
        p.x += p.vx;
        p.y += p.vy;

        const X = p.x | 0;
        const Y = p.y | 0;
        if (X < 0 || Y < 0 || X >= w - 1 || Y >= h - 1) continue;

        const o = (Y * w + X) * 4;
        if (!light) {
          this.plotAdd(d, o, p.cr, p.cg, p.cb, p.a);
          this.plotAdd(d, o + 4, p.cr, p.cg, p.cb, p.a * bloom);
          this.plotAdd(
            d,
            ((Y + 1) * w + X) * 4,
            p.cr,
            p.cg,
            p.cb,
            p.a * bloom,
          );
        } else {
          const ink = p.side === 0 ? THEME.light.ink.bull : THEME.light.ink.bear;
          const halo =
            p.side === 0 ? THEME.light.halo.bull : THEME.light.halo.bear;
          const detail = 0.55 + (p.lum / 255) * 0.45;
          const alpha = p.a * THEME.light.coreOpacity * detail;
          const haloAlpha = p.a * THEME.light.haloOpacity;
          this.plotInk(d, o + 4, halo[0], halo[1], halo[2], haloAlpha);
          this.plotInk(
            d,
            ((Y + 1) * w + X) * 4,
            halo[0],
            halo[1],
            halo[2],
            haloAlpha * 0.8,
          );
          this.plotInk(d, o, ink[0], ink[1], ink[2], alpha);
          this.plotInk(d, o + 4, ink[0], ink[1], ink[2], alpha * 0.36);
          this.plotInk(
            d,
            ((Y + 1) * w + X) * 4,
            ink[0],
            ink[1],
            ink[2],
            alpha * 0.24,
          );
        }
      }
    }

    this.ctx.putImageData(buf, 0, 0);
  }

  private frame = () => {
    this.raf = requestAnimationFrame(this.frame);
    if (!this.w || !this.h) return;

    if (this.reduced) {
      this.render();
      cancelAnimationFrame(this.raf);
      this.raf = 0;
      return;
    }

    this.t += 1 / 60;
    this.render();

    // Phones: assemble, then stop. Scroll still re-renders via onScroll.
    if (
      this.mobile &&
      !this.frozen &&
      performance.now() - this.startedAt > MOBILE_LAYOUT.freezeAfterMs
    ) {
      this.frozen = true;
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.startedAt = performance.now();
    this.resize();

    this.themeObserver = new MutationObserver(() => {
      this.setTheme(HeroParticleEngine.detectTheme());
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('profytron:theme-change', this.onThemeChange);
    this.raf = requestAnimationFrame(this.frame);
  }

  pause() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  resume() {
    if (!this.running || this.raf || this.reduced || this.frozen) return;
    this.raf = requestAnimationFrame(this.frame);
  }

  dispose() {
    this.running = false;
    this.pause();
    window.clearTimeout(this.resizeTimer);
    this.themeObserver?.disconnect();
    this.themeObserver = null;
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('profytron:theme-change', this.onThemeChange);
    this.particles = [];
    this.coveragePoints = [];
    this.edges = [];
    this.sources = [];
    this.transforms = [];
    this.bodyPoints = [];
    this.frameBuf = null;
    this.baseDark = null;
    this.baseLight = null;
  }

  get particleCount() {
    return this.particles.length;
  }
}
