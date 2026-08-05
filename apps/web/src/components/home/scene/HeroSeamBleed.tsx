"use client";

/**
 * HeroSeamBleed — carries the hero's texture past its bottom edge.
 *
 * Colour blending alone never removed the seam, because the *surface* still
 * stopped on a single pixel row: contours, rails and grid all ended together.
 * This continues them a few hundred pixels into the section below and fades
 * them out, so nothing terminates on a line.
 *
 * Two constraints drove the shape of this:
 *
 *  1. It cannot live inside the hero. The hero carries `overflow-x-hidden`,
 *     and per spec a non-visible overflow on one axis forces the other to
 *     compute as `auto` — so anything overflowing downward gets clipped.
 *
 *  2. `.landing-section` beneath paints an OPAQUE background and is a later
 *     sibling, so a z-auto layer here would be painted straight over. This
 *     sits at z-index 1: above that background, still below the section's own
 *     content, which is `.page-container` at z-10.
 *
 * It occupies no layout space — height 0, absolutely positioned canvas.
 */

import React from "react";
import { EXECUTION_CORE, HERO_SEAM } from "./hero-scene-config";

type Mode = "dark" | "light";

function seeded(index: number) {
  const x = Math.sin(index * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function withAlpha(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
      : h,
    16,
  );
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export function HeroSeamBleed({ active }: { active: boolean }) {
  const wrapRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!active || !HERO_SEAM.enabled) return;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;

    /** Hero geometry, so the continuation lines up with what it drew. */
    const heroBox = () => {
      const hero = wrap.previousElementSibling as HTMLElement | null;
      if (!hero) return null;
      const r = hero.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      // The engine caps its backing store the same way; matching it keeps the
      // contour pitch and rail angles identical across the boundary.
      const scale = Math.min(
        1,
        EXECUTION_CORE.canvas.maxWidth / r.width,
        EXECUTION_CORE.canvas.maxHeight / r.height,
      );
      return { w: r.width * scale, h: r.height * scale, cssW: r.width, scale };
    };

    const draw = (time: number) => {
      const box = heroBox();
      if (!box) return;

      const bleedCss = HERO_SEAM.height;
      const w = Math.round(box.w);
      const h = Math.round(bleedCss * box.scale);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      const mode: Mode = document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
      const material = EXECUTION_CORE.theme[mode];
      ctx.clearRect(0, 0, w, h);

      // Everything is drawn in the hero's coordinate space and shifted up, so
      // row 9 of the contours lands exactly where row 8 was heading.
      ctx.save();
      ctx.translate(0, -box.h);

      // 1. Contours, continuing the same pitch and phase.
      ctx.lineWidth = mode === "dark" ? 0.7 : 0.85;
      for (let row = 7; row < 7 + HERO_SEAM.contourRows; row++) {
        const yBase = box.h * (0.13 + row * 0.105);
        if (yBase < box.h - 40 || yBase > box.h + h + 40) continue;
        ctx.beginPath();
        for (let x = -8; x <= box.w + 8; x += 8) {
          const u = x / box.w;
          const y =
            yBase +
            Math.sin(u * 5.4 + row * 0.68 + time * 0.12) * box.h * 0.024 +
            Math.sin(u * 13.2 - time * 0.16 + row) * box.h * 0.009;
          if (x < 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const mix = (row % 8) / 7;
        ctx.strokeStyle = withAlpha(
          mix < 0.5 ? material.tealSoft : material.crimsonSoft,
          mode === "dark" ? 0.095 : 0.12,
        );
        ctx.stroke();
      }

      // 2. Rail tails — only the downward half of the fan reaches past the edge.
      const layout = EXECUTION_CORE.layout.desktop;
      const cx = box.w * layout.x;
      const cy = box.h * layout.y;
      const radius = Math.min(box.w, box.h) * layout.radius;
      const cfg = EXECUTION_CORE.paths;

      for (let i = 0; i < cfg.radialCount; i++) {
        const angle =
          (i / cfg.radialCount) * Math.PI * 2 +
          cfg.angleOffset +
          (seeded(i * 11 + 5) - 0.5) * cfg.angleJitter;
        const dir = { x: Math.cos(angle), y: Math.sin(angle) };
        if (dir.y <= 0.15) continue; // upward rails never cross the seam

        const reach = Math.min(
          radius * (cfg.reach + seeded(i * 5 + 3) * cfg.reachJitter),
          Math.min(box.w, box.h) * cfg.maxReach,
        );
        const inner = radius * 1.62;
        const start = {
          x: cx + dir.x * reach,
          y: cy + dir.y * reach * cfg.squashY,
        };
        if (start.y < box.h) continue; // this one stops short of the boundary

        const end = { x: cx + dir.x * inner, y: cy + dir.y * inner };
        const horiz = Math.abs(dir.x);
        const bend = (seeded(i * 7 + 9) - 0.5) * cfg.bow;
        const bow = bend * radius * (1 + horiz * cfg.horizontalBow);
        const lift = box.h * cfg.controlLift * (0.6 + horiz * 0.9);
        const ctrl = {
          x: (start.x + end.x) / 2 - dir.y * bow,
          y: (start.y + end.y) / 2 - lift + dir.x * bow,
        };

        const colour = dir.x < 0 ? material.tealSoft : material.crimsonSoft;
        const peak = cfg.railAlpha[mode];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.bezierCurveTo(
          start.x + ((ctrl.x - start.x) * 2) / 3,
          start.y + ((ctrl.y - start.y) * 2) / 3,
          end.x + ((ctrl.x - end.x) * 2) / 3,
          end.y + ((ctrl.y - end.y) * 2) / 3,
          end.x,
          end.y,
        );
        const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
        grad.addColorStop(0, withAlpha(colour, peak * cfg.fade.outer));
        grad.addColorStop(cfg.fade.kneeAt, withAlpha(colour, peak * cfg.fade.knee));
        grad.addColorStop(1, withAlpha(colour, peak));
        ctx.strokeStyle = grad;
        ctx.lineWidth = mode === "dark" ? 0.8 : 1;
        ctx.stroke();
      }

      ctx.restore();

      // 3. Dissolve downward, so the continuation itself never ends on a line.
      const fade = ctx.createLinearGradient(0, 0, 0, h);
      fade.addColorStop(0, "rgba(0,0,0,1)");
      fade.addColorStop(HERO_SEAM.fadeKnee, `rgba(0,0,0,${HERO_SEAM.knee})`);
      fade.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (visible) draw(now / 1000);
    };

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => {
              visible = entry.isIntersecting;
            },
            { rootMargin: "120px" },
          )
        : null;
    io?.observe(wrap);

    const onResize = () => draw(performance.now() / 1000);
    window.addEventListener("resize", onResize, { passive: true });

    if (reduced) {
      // Match the engine: hold a settled frame rather than animating.
      draw(0);
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io?.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [active]);

  if (!HERO_SEAM.enabled) return null;

  return (
    <div ref={wrapRef} className="hero-seam-bleed" aria-hidden>
      <canvas ref={canvasRef} />
    </div>
  );
}
