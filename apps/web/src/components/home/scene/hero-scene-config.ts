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

/**
 * ─── TRIAL SWITCH: seam texture bleed ────────────────────────────────────────
 * Continues the hero's contours and rail tails a short way into the section
 * below, then dissolves them, so the surface never terminates on a line.
 *
 * The hero's own scrim is left alone — this handles the texture edge, the
 * scrim handles the tonal one. Set enabled false to remove it entirely.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const HERO_SEAM = {
  enabled: true,
  /** How far the texture reaches past the hero, in CSS px. */
  height: 300,
  /** Contour rows to attempt past the edge; out-of-range ones are skipped. */
  contourRows: 5,
  /** Alpha remaining at `fadeKnee` down the bleed. */
  knee: 0.34,
  fadeKnee: 0.45,
};

/**
 * ─── TRIAL SWITCH: ground ramp ───────────────────────────────────────────────
 * The seam survived every gradient because it was never one problem:
 *
 *   1. The stage's ground colour is not the site's ground colour. Light
 *      #E2E9EC meets --bg-secondary #ECEDF0; dark #040709 meets --background
 *      #1E252B, which is near-black meeting mid-slate.
 *   2. The section below draws a literal 1px `border-t` at the boundary.
 *   3. The creatures are clipped mid-body on that same pixel row.
 *   4. The scrim faded toward --bg-secondary in BOTH themes, so in dark it
 *      overshot past the #1E252B it was heading for and landed brighter.
 *
 * Fading across the boundary cannot fix (1): a ramp between two flat fields
 * has a knee at each end, and the eye finds those knees as readily as the
 * original edge — which is why the last attempt read as *more* structure, not
 * less.
 *
 * So this stops blending across the seam and removes the difference at it.
 * The stage's base colour becomes the site's own token, and the hero's depth
 * comes back as a ramp that is fully opaque through the headline and core and
 * has already resolved to the site colour before it reaches its own bottom
 * edge. At the boundary row the two surfaces are identical, so there is
 * nothing left to blend.
 *
 * Everything hangs off `data-hero-ground` in globals.css. Set enabled false
 * and the stage, the creature mask and the scrim all revert together.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const HERO_GROUND = {
  enabled: true,
  /**
   * ─── FALLBACK ────────────────────────────────────────────────────────────
   * "balanced" is the approved state: the ramp resolves fully to the site
   * token by the hero's own bottom edge. Set this back to "balanced" and the
   * deep profile — longer blacks, the tail, the wash continuation — all turn
   * off together and the page returns to exactly that.
   *
   * "deep" keeps true black much further down, then hands the remaining
   * distance to a tail that continues past the hero, so the blue-slate
   * ground arrives well below the fold instead of at the seam.
   *
   * It also continues the engine's radial wash past the edge. That wash is
   * centred at 0.76w, so at the hero's bottom row it has fallen to nothing on
   * the left but still lifts the right by roughly +8/+3/+4 — which is why the
   * seam reads as a line on the right only, and is invisible on the left.
   * ─────────────────────────────────────────────────────────────────────────
   */
  profile: "deep" as "deep" | "balanced",
  /**
   * Where the ramp starts leaving the hero's own colour, as a fraction of
   * hero height. Everything above this is untouched — the approved dark stage
   * is exactly as it was through the headline, core and creature heads.
   */
  holdTo: 0.42,
  /**
   * Where the creature cutouts start dissolving, as a fraction of each
   * image's own box, so no body ends on the boundary row. They are fully
   * transparent by 0.82 — see the breakpoint table in globals.css for why
   * that single stop clears the clip at every size.
   */
  animalFadeFrom: 0.58,
  /**
   * deep only. How much true black is still on the hero's bottom row, as an
   * alpha over the site token. The tail below starts at exactly this value,
   * which is what keeps the boundary continuous — the hero no longer has to
   * finish the whole transition inside its own box.
   */
  handoff: 0.5,
  /** deep only. CSS px the black tail continues past the hero. */
  tailHeight: 440,
};

/** Dark only. Light already resolves cleanly and is left on the balanced ramp. */
export const HERO_GROUND_DEEP = HERO_GROUND.profile === "deep";

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
   *   'ribbon'   — liquid ribbon: one folded translucent strip with lit cyan
   *                and crimson edges, revolving orbit rings (current trial)
   *   'void'     — no symbol; the rails are consumed into a soft well with a
   *                single breathing rim (FALLBACK — the approved state)
   *   'aperture' — mechanical iris that opens for an accepted signal and bites
   *                shut on a rejected one
   *   'cross'    — the original decision marker, kept intact
   *
   * Flip this one string to switch. Nothing else needs touching.
   * ───────────────────────────────────────────────────────────────────────────
   */
  emblemKind: "ribbon" as "ribbon" | "void" | "aperture" | "cross",

  /**
   * ─── Liquid ribbon centrepiece ───────────────────────────────────────────
   * FALLBACK: set `emblemKind` back to "void" above. Nothing else needs to
   * change — drawVoidEmblem is untouched and this block simply stops being
   * read. Every other trial switch is independent of it.
   *
   * The centreline is not a hand-authored bezier. It is built by integrating
   * a tangent angle, which is what makes the shape a ribbon rather than a
   * ring: hand-placed knots around a centre always close into an oval, and
   * three attempts at that read as a chain link or a loading spinner.
   *
   * Integrating the tangent instead means the angle sweeps slowly along the
   * tails and races through 2π inside one short window, so the strip runs
   * out, folds over itself exactly once, and runs off again. Two open ends
   * and one crossing — no closed lobes, so it cannot read as an 8, a ring,
   * a link or a P.
   *
   *   phi(t) = phi0 + sweep·t + wobble·sin(2π·wobbleFreq·t) + 2π·S(t)
   *   S(t)   = logistic centred on loopAt with scale loopWidth
   *
   * These values came out of a search over the parameter space for exactly
   * one self-crossing and a ~1.5:1 footprint. The fold's radius is 0.080 in
   * the normalised frame, comfortably clear of the pinched half-width, so
   * the loop stays open instead of blobbing shut.
   * ─────────────────────────────────────────────────────────────────────────
   */
  ribbon: {
    /**
     * ─── TRIAL SWITCH: ribbon form ───────────────────────────────────────
     * 'mark' — two strands derived from the Profytron mark: the slanted stem
     *          and the chevron, floating apart as suspended strips
     * 'curl' — the abstract single folded strip (previous trial)
     *
     * Both are ribbons in the same material; only the centrelines differ.
     * ─────────────────────────────────────────────────────────────────────
     */
    form: "mark" as "mark" | "curl",
    /**
     * Logo-derived centrelines, normalised to the mark's own bounding box
     * (175×177 with the mark spanning x 2–171, y 2–173, so one unit is 171px
     * and the origin is the mark's centre).
     *
     * Traced off brand-mark-tight.png rather than eyeballed. The stem is a
     * parallelogram blade leaning ~15° from vertical with a constant 43px
     * horizontal width and pointed apexes at (86,4) and (2,173); its midline
     * runs (66.8,4) → (21.5,173). The chevron is a ">" opening left, its
     * point at (171,35), upper arm ~12° below horizontal and lower arm ~32°,
     * arm thickness ~30px.
     *
     * Two strands, not one: the mark is two separate pieces, and inventing a
     * connector between them to make a single continuous strip would change
     * what it reads as. Floating apart, they read as suspended sculpture
     * rather than as a logo laid flat.
     *
     * The knots carry a slight lateral bow the flat mark does not have, and
     * the chevron's point is rounded, so the form is liquid rather than
     * origami — the shape of the logo, not the logo.
     */
    mark: {
      /**
       * The mark is taller than it is wide, so this is set against its own
       * extent (1.067 × 1.232 normalised) rather than left at 1. At 0.86 it
       * lands at 151×174 CSS px on desktop — the same visual weight as the
       * curl's 164×109, not the 203×234 that scaling to `size` directly
       * would have produced.
       */
      scale: 0.86,
      stem: [
        [-0.115, -0.488],
        [-0.16, -0.34],
        [-0.212, -0.13],
        [-0.272, 0.1],
        [-0.328, 0.31],
        [-0.38, 0.5],
      ],
      stemWidth: 0.122,
      chevron: [
        [0.049, -0.412],
        [0.25, -0.372],
        [0.42, -0.33],
        [0.477, -0.292],
        [0.43, -0.232],
        [0.23, -0.128],
        [0.061, -0.032],
      ],
      chevronWidth: 0.088,
      /** Centreline resolution per strand. */
      samples: 96,
    },
    /** Footprint as a multiple of the core radius. */
    size: 1.5,
    mobileSize: 1.1,
    /** Widest half-width, in units of the footprint. */
    width: 0.075,
    /** Centreline resolution. Cached — this is not per-frame work. */
    samples: 132,
    path: {
      phi0: -0.4,
      sweep: 1.6,
      wobble: 1.3,
      wobbleFreq: 0.9,
      loopAt: 0.5,
      loopWidth: 0.058,
    },
    /**
     * Travelling edge highlights. Drawn as one dashed stroke per edge with an
     * animated dash offset, so a lit arc runs along the path for two draw
     * calls instead of one per segment.
     */
    flow: { speed: 0.075, arc: 0.34, offset: 0.42 },
    /**
     * Slow float. Brief: 8–12s, no more than 4–6px of lift, 2–4° of tilt,
     * 0.985–1.015 of scale. Lift is in units of the CORE radius, not the
     * footprint, so it stays in that pixel band at every breakpoint.
     */
    float: { seconds: 10.5, lift: 0.055, tilt: 0.052, scale: 0.012 },
    /**
     * Faint rings revolving around the ribbon. They ride `orbitExpansion()`,
     * the same scroll response the rail field and the risk checkpoints use,
     * so the whole field still breathes as one.
     */
    orbits: { enabled: true, spin: 0.05, counterSpin: -0.037 },
    /**
     * Semantic material tokens. Light is not an inversion or a filter — it is
     * its own set of deeper, desaturated values, and both themes composite
     * with plain source-over. No additive blending, which would only work on
     * a dark ground.
     */
    theme: {
      dark: {
        body: "#9DC0CC",
        bodyAlpha: 0.13,
        cyan: "#7BD5E6",
        crimson: "#DF6E77",
        reflection: "#CBDDE3",
        reflectionAlpha: 0.22,
        edgeAlpha: 0.72,
        glow: 0.3,
        orbit: 0.15,
      },
      light: {
        body: "#5C7B87",
        bodyAlpha: 0.15,
        cyan: "#0F5F6C",
        crimson: "#8B333A",
        reflection: "#41606B",
        reflectionAlpha: 0.24,
        edgeAlpha: 0.8,
        glow: 0,
        orbit: 0.2,
      },
    },
  },

  /**
   * The three straight output lanes that ran from the core off the right edge,
   * across the bear. They were a separate fan from the signal rails — fixed at
   * angles [-0.34, 0, 0.34] and always horizontal, which is why they read as
   * three deliberate lines no matter how the rails were tuned.
   *
   * Off by default: the radial rails already travel in every direction, so a
   * dedicated rightward fan adds nothing but those three lines.
   * Set true to restore them.
   */
  outputs: { enabled: false },

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
    reach: 6.5,
    /** Per-rail variation on that reach, so they don't end on a clean circle. */
    reachJitter: 2.7,
    /**
     * Safety net on rail length, as a fraction of the shorter stage axis.
     *
     * Applied to the REST size only, before scroll expansion — otherwise the
     * clamp would cap the breath itself and the fan would stop growing partway
     * through the scroll. Set well above the natural range so it catches a
     * stray outlier and nothing else; if most rails clamp they all end at the
     * same distance, which is the same uniformity problem in another shape.
     */
    maxReach: 1.2,
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
    fade: { outer: 0, knee: 0.36, kneeAt: 0.52 },
    /** Travelling signals ramp on the same curve so they never float alone. */
    signalFadeExponent: 1.15,
    /** Peak rail alpha where it meets the core. */
    railAlpha: { dark: 0.26, light: 0.3 },
  },

  /**
   * ─── TRIAL SWITCH: scroll behaviour ────────────────────────────────────────
   * 'expand' — the converging rails and the orbiting checkpoints breathe
   *            outward as the hero exits, and draw back in on the way up. The
   *            core itself holds still and the void never changes size, so the
   *            growth reads as the field opening around a fixed centre.
   * 'drift'  — the original sideways translation of the whole core.
   *
   * They are mutually exclusive on purpose: a core translating sideways while
   * its fan expands reads as a smear rather than a breath.
   * ───────────────────────────────────────────────────────────────────────────
   */
  scroll: {
    mode: "expand" as "expand" | "drift",
    /** Rail growth at full scroll. 1.2 → 220% of rest size. */
    railExpand: 1.2,
    /**
     * Checkpoint orbit growth at full scroll. These keep their rest radius —
     * the base area increase is for the converging rails alone — but they
     * travel outward with the scroll so the whole field breathes together.
     */
    orbitExpand: 1.2,
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
