/**
 * Hero scene configuration.
 *
 * ─── HOW TO REVERT ───────────────────────────────────────────────────────────
 * Set HERO_SCENE to 'particles' to restore the bull/bear sculpture, or 'off'
 * to return to the static mesh + HeroAmbientVisual chart.
 *
 * NEXT_PUBLIC_HERO_SCENE overrides this per environment.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type HeroScene = "execution-core" | "particles" | "off";

const DEFAULT_SCENE: HeroScene = "execution-core";

function read(): HeroScene {
  const raw = process.env.NEXT_PUBLIC_HERO_SCENE;
  if (raw === "execution-core" || raw === "particles" || raw === "off")
    return raw;
  return DEFAULT_SCENE;
}

export const HERO_SCENE: HeroScene = read();

/**
 * ─── TRIAL SWITCH: core placement ────────────────────────────────────────────
 * 'anchored' — core sits right, over the bear. The original arrangement.
 * 'raised'   — core centred and lifted, so it sits between the two animals
 *              instead of on one of them. Pairs with a narrower copy column
 *              (see [data-hero-layout="raised"] in globals.css).
 *
 * Flip this one string to revert; the anchored numbers are kept verbatim.
 *
 * Mobile is intentionally identical in both. At phone widths the copy is a
 * single full-width column, so a centred core would sit directly behind the
 * headline — there is no room to centre into.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export type HeroLayoutVariant = "raised" | "anchored";
export const HERO_LAYOUT_VARIANT: HeroLayoutVariant = "raised";

const HERO_LAYOUTS = {
  anchored: {
    desktop: { x: 0.755, y: 0.515, radius: 0.115 },
    tablet: { x: 0.76, y: 0.57, radius: 0.105 },
    mobile: { x: 0.73, y: 0.78, radius: 0.105 },
  },
  raised: {
    desktop: { x: 0.5, y: 0.44, radius: 0.115 },
    tablet: { x: 0.5, y: 0.49, radius: 0.105 },
    mobile: { x: 0.73, y: 0.78, radius: 0.105 },
  },
} as const;

/**
 * Product-specific vector scene. Values are normalized or theme materials so
 * the dark and light renderings cannot drift into different compositions.
 */
export const EXECUTION_CORE = {
  assets: {
    logo: "/icons/icon-192.png",
    bull: "/hero/bull-cutout.png",
    bear: "/hero/bear-cutout.png",
  },
  canvas: {
    maxWidth: 1200,
    maxHeight: 680,
  },
  layout: HERO_LAYOUTS[HERO_LAYOUT_VARIANT],
  /**
   * ─── TRIAL SWITCH ──────────────────────────────────────────────────────────
   * `emblemKind` selects what sits at the centre of the core.
   *
   *   'aperture' — mechanical iris that opens for an accepted signal and bites
   *                shut on a rejected one (current trial)
   *   'cross'    — the previous decision marker, kept intact
   *
   * Flip this one string to revert. Nothing else needs touching.
   * ───────────────────────────────────────────────────────────────────────────
   */
  emblemKind: "aperture" as "aperture" | "cross",

  /**
   * Concentric gates and the scan arc. Off leaves the aperture as the only
   * object at the centre, which is how the approved study read — the iris
   * carries the beat on its own and doesn't need a frame around it.
   * Set true to restore them.
   */
  showRings: false,

  /**
   * ─── TRIAL SWITCH: signal rails ────────────────────────────────────────────
   * 'anchored' — original: rails begin at fixed screen positions, which bunch
   *              on the left and cut across the copy at full strength.
   * 'radial'   — rails radiate evenly around the core and fade out toward
   *              their far ends, so they deepen into the rings and dissolve
   *              before they reach the headline.
   *
   * Flip back to "anchored" to restore the original rails.
   * ───────────────────────────────────────────────────────────────────────────
   */
  paths: {
    style: "radial" as "radial" | "anchored",
    /**
     * Rail count. Ten evenly-spaced rails read as a star; the scatter only
     * appears once there are enough of them that the eye stops counting.
     */
    radialCount: 34,
    /** Outer extent of a rail, in multiples of the core radius. */
    reach: 2.8,
    /** Per-rail variation on that reach, so they don't end on a clean circle. */
    reachJitter: 2.0,
    /**
     * Safety net on rail length, as a fraction of the shorter stage axis.
     * Deliberately above the natural range so only a stray outlier meets it —
     * if most rails clamp they all end at the same distance, which is the same
     * uniformity problem in a different shape.
     */
    maxReach: 0.5,
    /** Angular offset of the fan, radians. */
    angleOffset: 0.28,
    /**
     * Random angular scatter either side of the even spacing. Without this the
     * rails sit on a perfect wheel no matter how many there are.
     */
    angleJitter: 0.55,
    /**
     * Vertical squash. A circular fan reads as a starburst; flattening it
     * spreads the rails horizontally into the wide hero and keeps them off the
     * headline's line height.
     */
    squashY: 0.62,
    /** Upward pull on each rail's control point, as a fraction of stage height. */
    controlLift: 0.05,
    /** Sideways bow, in multiples of core radius. */
    bow: 1.6,
    /**
     * Extra bow applied in proportion to how horizontal a rail is.
     *
     * The vertical squash has no effect at angle 0, so without this the
     * near-horizontal rails are the only straight lines in the fan — and a
     * straight line across open space is exactly what the eye picks out.
     */
    horizontalBow: 1.15,
    /**
     * Alpha ramp along a rail: transparent at the outer end, `knee` of full
     * strength at the midpoint, full where it meets the rings.
     */
    fade: { outer: 0, knee: 0.22, kneeAt: 0.62 },
    /** Travelling signals ramp on the same curve so they never float alone. */
    signalFadeExponent: 1.35,
  },

  motion: {
    scrollConverge: 0.035,
    ringSpeed: 0.16,
    emblem: {
      cycleSeconds: 7.6,
      bounce: 0.026,
      scale: 0.035,
      armRotation: 0.18,
    },
    /**
     * The iris is driven by the live signal stream rather than a timer: blades
     * open as accepted signals land on the core and bite shut as rejected ones
     * branch away, so the converging paths finally resolve into a verdict.
     */
    aperture: {
      blades: 8,
      /** Opening at rest, as a fraction of blade span. */
      restOpen: 0.44,
      /** How far an accepted arrival pushes it open. */
      openBoost: 0.3,
      /** How far a rejection pulls it shut. */
      closeBite: 0.24,
      /** Smoothing on the response; lower is heavier. */
      responseLerp: 0.11,
      /** Normalises raw signal pressure into 0–1. */
      pressureScale: 2.4,
      /** Slow blade rotation — mechanism, not decoration. */
      spin: 0.05,
      /**
       * Blade span as a fraction of core radius. With the gates hidden the
       * iris takes over the space they occupied and becomes the whole object.
       */
      outer: 1.15,
    },
    depth: {
      lerp: 0.055,
      driftSeconds: 12.5,
      mobileFrameMs: 32,
      grid: { x: 3, y: 2, drift: 0.8 },
      network: { x: 6, y: 4, drift: 1.5 },
      core: { x: 5, y: 3, drift: 1.2 },
    },
  },
  signals: {
    desktopCount: 92,
    mobileCount: 46,
    rejectedRatio: 0.22,
  },
  figures: {
    /** Preserved as an optional layer while a better light treatment is explored. */
    enabled: false,
    desktopHeight: 1.06,
    mobileHeight: 0.62,
    desktop: {
      bullX: 0.31,
      bearX: 0.9,
      top: 0.045,
    },
    mobile: {
      bullX: 0.12,
      bearX: 0.93,
      top: 0.39,
    },
    opacity: {
      dark: 0.095,
      light: 0.052,
    },
  },
  theme: {
    dark: {
      background: "#040709",
      teal: "#58C5D7",
      tealSoft: "#2C8293",
      crimson: "#E05B63",
      crimsonSoft: "#82383F",
      neutral: "#B7CCD2",
      decisionCross: "#C3D5DA",
      grid: "#52727A",
      glow: 1,
    },
    light: {
      background: "#E2E9EC",
      teal: "#176B7A",
      tealSoft: "#5D9EAA",
      crimson: "#963A40",
      crimsonSoft: "#B7787C",
      neutral: "#415B64",
      decisionCross: "#315E67",
      grid: "#799098",
      glow: 0.24,
    },
  },
} as const;

/** Both themes share one sculpture, so switching theme only changes material. */
export const CREATURE_SRC = {
  bull: "/hero/bull.png",
  bear: "/hero/bear.png",
} as const;

/** Approved dark composition. Light deliberately reuses it without retuning. */
export const LAYOUT = {
  inset: 0.035,
  heightOfStage: 0.92,
  heightOfWidth: 0.3,
  floorLift: 0.03,
};

/**
 * Phone layout. At 390px wide, creatures at 30% of width are ~117px and
 * unreadable, so phones anchor them to opposite corners at a larger scale.
 */
export const MOBILE_LAYOUT = {
  breakpoint: 767,
  heightOfWidth: 0.46,
  bleed: 0.1,
  bullTopBias: 0.28,
  /** Phones assemble once, then stop the loop. Scroll still repaints. */
  freezeAfterMs: 4200,
  stride: 4,
};

export const TUNING = {
  /** Sampling stride in source pixels, for the dark particle cloud. */
  stride: 2,
  strideSmall: 3,
  minAlpha: 60,
  minLuma: 26,
  lightCoverageStride: 2,
  lightCoverageMinAlpha: 38,
  creatureOpacity: 1,
  /** Light bled into the right/lower neighbour — the additive glow. */
  bloom: 0.3,
  pointerRadius: 95,
  pointerForce: 12,
  maxCanvasWidth: 1100,
  maxCanvasHeight: 620,
};

export const THEME = {
  dark: {
    background: [4, 7, 9] as [number, number, number],
    /** Per-particle wander. Gives the cloud its shimmer. */
    drift: 1.1,
  },
  light: {
    background: [226, 233, 236] as [number, number, number],
    /** Light keeps moving, but more calmly than the luminous dark sculpture. */
    drift: 0.38,
    pointerForce: 8,
    ink: {
      bull: [24, 76, 91] as [number, number, number],
      bear: [124, 39, 44] as [number, number, number],
    },
    halo: {
      bull: [69, 139, 154] as [number, number, number],
      bear: [174, 83, 87] as [number, number, number],
    },
    coreOpacity: 0.94,
    haloOpacity: 0.18,
    underprintOpacity: {
      bull: 0.34,
      bear: 0.44,
    },
    /**
     * Static stage wash — teal at the bull's edge, crimson at the bear's, so
     * the artwork sits in a field rather than floating on neutral grey.
     */
    wash: {
      teal: [52, 131, 152] as [number, number, number],
      crimson: [151, 51, 54] as [number, number, number],
      strength: 0.075,
    },
  },
};

/**
 * Background layers. Both run in BOTH themes — additive over the dark ground,
 * alpha-blended as dark strokes over paper.
 */
export const LAYERS = {
  /** Flowing price-curve bands spanning the empty upper-centre. */
  contours: {
    enabled: true,
    count: 9,
    opacity: 0.16,
    lightOpacity: 0.105,
    top: 0.12,
    spacing: 0.085,
  },
  /**
   * Sobel-traced outlines — the ghost that expands and contracts behind each
   * creature. Traced per theme, so it always matches the artwork on screen.
   */
  lineArt: {
    enabled: true,
    threshold: 55,
    stride: 2,
    scale: 1.62,
    /** Scale swing either side of `scale` — this is the expansion. */
    scaleBreathe: 0.22,
    breatheSpeed: 0.42,
    lift: 0.08,
    opacity: 0.34,
    /** Depth of the fade, 0–1. Widest is faintest. */
    pulseDepth: 0.78,
    light: {
      scale: 1.15,
      scaleBreathe: 0.065,
      lift: 0.025,
      opacity: 0.26,
      pulseDepth: 0.46,
    },
  },
};

/** Ink used for the background layers on paper (additive can't show there). */
export const LIGHT_LINE_INK = {
  bull: [31, 87, 101] as [number, number, number],
  bear: [138, 49, 52] as [number, number, number],
  neutral: [92, 112, 120] as [number, number, number],
};

/**
 * Scroll behaviour — "converge". The creatures lean toward each other as the
 * hero exits: continuous, visible during ordinary scrolling, no pinning, and
 * the only interaction with parity between phone and desktop.
 */
export const SCROLL = {
  enabled: true,
  converge: 0.18,
  intermingle: 0.06,
  lift: 0.04,
};
