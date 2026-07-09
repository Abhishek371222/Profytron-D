/**
 * Generates premium marketplace globe SVG assets (1000×1000 viewBox).
 * Brand colors: #348398, #9FE1F3, #ADFFFC
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../public/marketplace/globe");
mkdirSync(OUT, { recursive: true });

const C = "#348398";
const C2 = "#9FE1F3";
const C3 = "#ADFFFC";
const CX = 500;
const CY = 500;
const R = 420;

function inSphere(x, y) {
  const dx = (x - CX) / R;
  const dy = (y - CY) / R;
  return dx * dx + dy * dy <= 1;
}

function inRegion(x, y, regions) {
  return regions.some(([x0, x1, y0, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
}

const continentRegions = [
  [180, 340, 300, 460], // North America
  [300, 380, 480, 680], // South America
  [440, 560, 280, 400], // Europe
  [460, 580, 400, 640], // Africa
  [560, 820, 280, 540], // Asia
  [720, 840, 520, 620], // Australia
];

function generateContinentsDots() {
  const dots = [];
  const step = 9;
  for (let y = CY - R; y <= CY + R; y += step) {
    for (let x = CX - R; x <= CX + R; x += step) {
      if (!inSphere(x, y)) continue;
      if (!inRegion(x, y, continentRegions)) continue;
      // organic edge falloff
      const jitter = ((x * 17 + y * 31) % 7) / 10;
      if (jitter > 0.55) continue;
      const r = 1.1 + ((x + y) % 5) * 0.15;
      const op = 0.25 + ((x * y) % 20) / 100;
      dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${C}" fill-opacity="${op.toFixed(2)}"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">\n  <g>${dots.join("\n  ")}</g>\n</svg>`;
}

function generateWorldWireframe() {
  const lats = [-60, -30, 0, 30, 60];
  const latEllipses = lats
    .map((lat) => {
      const ry = Math.cos((lat * Math.PI) / 180) * R;
      const cy = CY - (lat / 90) * R * 0.92;
      const op = lat === 0 ? 0.38 : 0.12 + Math.abs(lat) / 300;
      const sw = lat === 0 ? 1.8 : 1;
      return `<ellipse cx="${CX}" cy="${cy.toFixed(1)}" rx="${R}" ry="${ry.toFixed(1)}" stroke="${C2}" stroke-opacity="${op.toFixed(2)}" stroke-width="${sw}" fill="none"/>`;
    })
    .join("\n  ");

  const longitudes = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 180) / 12;
    const op = 0.1 + (i % 3) * 0.03;
    return `<ellipse cx="${CX}" cy="${CY}" rx="${R * 0.22}" ry="${R}" transform="rotate(${angle} ${CX} ${CY})" stroke="${C}" stroke-opacity="${op.toFixed(2)}" stroke-width="1" fill="none"/>`;
  }).join("\n  ");

  const nodes = [
    [295, 370],
    [495, 320],
    [595, 380],
    [680, 470],
    [740, 340],
    [780, 560],
  ]
    .map(
      ([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="6" fill="${C}" fill-opacity="0.12"/><circle cx="${x}" cy="${y}" r="3" fill="${C2}"/>`,
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">
  <defs>
    <radialGradient id="glow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="${C}" stop-opacity="0.18"/>
      <stop offset="55%" stop-color="${C2}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${C}" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="sphereClip">
      <circle cx="${CX}" cy="${CY}" r="${R}"/>
    </clipPath>
  </defs>
  <circle cx="${CX}" cy="${CY}" r="${R + 8}" fill="url(#glow)"/>
  <g clip-path="url(#sphereClip)">
  <circle cx="${CX}" cy="${CY}" r="${R}" stroke="${C}" stroke-opacity="0.2" stroke-width="1.2" fill="none"/>
  ${latEllipses}
  ${longitudes}
  ${nodes}
  </g>
</svg>`;
}

function generateRoutes() {
  const paths = [
    "M 295 370 Q 390 280, 495 320",
    "M 495 320 Q 545 340, 595 380",
    "M 595 380 Q 640 420, 680 470",
    "M 295 370 Q 450 220, 595 380",
    "M 495 320 Q 620 480, 680 470",
    "M 680 470 Q 720 400, 740 340",
    "M 740 340 Q 760 450, 780 560",
    "M 495 320 Q 680 300, 740 340",
  ];
  const pathEls = paths
    .map(
      (d, i) =>
        `<path class="route-path" d="${d}" stroke="url(#routeGrad)" stroke-width="${i < 3 ? 1.8 : 1.2}" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="8 12" opacity="${i < 3 ? 1 : 0.55}"/>`,
    )
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">
  <defs>
    <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${C2}" stop-opacity="0"/>
      <stop offset="35%" stop-color="${C2}" stop-opacity="0.9"/>
      <stop offset="65%" stop-color="${C}" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="${C2}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  ${pathEls}
</svg>`;
}

function generateParticles() {
  const layers = [
    { count: 80, rMin: 0.4, rMax: 1, op: 0.25, seed: 1 },
    { count: 45, rMin: 0.8, rMax: 1.6, op: 0.4, seed: 7 },
    { count: 18, rMin: 2, rMax: 4, op: 0.35, seed: 13 },
  ];
  const dots = [];
  for (const layer of layers) {
    for (let i = 0; i < layer.count; i++) {
      const t = layer.seed * 1000 + i * 7919;
      const x = CX - R + (t % (R * 2));
      const y = CY - R + ((t * 3) % (R * 2));
      if (!inSphere(x, y)) continue;
      const r = layer.rMin + (t % 100) / 100 * (layer.rMax - layer.rMin);
      const fill = i % 3 === 0 ? C3 : C2;
      dots.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(2)}" fill="${fill}" fill-opacity="${layer.op}"/>`);
    }
  }
  // foreground dust outside sphere
  for (let i = 0; i < 35; i++) {
    const t = i * 3571;
    const x = 80 + (t % 840);
    const y = 80 + ((t * 2) % 840);
    const r = 0.5 + (t % 3) * 0.3;
    dots.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${C2}" fill-opacity="0.2"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">\n  <g>${dots.join("\n  ")}</g>\n</svg>`;
}

function generateNodes() {
  const hubs = [
    [295, 370],
    [495, 320],
    [595, 380],
    [680, 470],
    [740, 340],
    [780, 560],
  ];
  const els = hubs
    .map(
      ([x, y], i) => `
  <g class="globe-node" style="animation-delay:${i * 0.4}s">
    <circle cx="${x}" cy="${y}" r="14" fill="${C}" fill-opacity="0.08"/>
    <circle cx="${x}" cy="${y}" r="8" fill="${C2}" fill-opacity="0.15"/>
    <circle cx="${x}" cy="${y}" r="4" fill="${C2}"/>
    <circle cx="${x}" cy="${y}" r="1.5" fill="${C3}"/>
  </g>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">
  <defs>
    <filter id="nodeGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="3" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#nodeGlow)">${els}
  </g>
</svg>`;
}

function generateRadialGlow() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">
  <defs>
    <radialGradient id="radialGlow" cx="50%" cy="48%" r="52%">
      <stop offset="0%" stop-color="${C}" stop-opacity="0.28"/>
      <stop offset="40%" stop-color="${C2}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${C}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="${CX}" cy="${CY}" r="480" fill="url(#radialGlow)"/>
  <ellipse cx="${CX}" cy="${CY + 120}" rx="320" ry="60" fill="${C2}" fill-opacity="0.06"/>
</svg>`;
}

function generateGradientMesh() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">
  <defs>
    <radialGradient id="meshA" cx="38%" cy="42%" r="48%">
      <stop offset="0%" stop-color="${C3}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${C}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="meshB" cx="72%" cy="58%" r="42%">
      <stop offset="0%" stop-color="${C2}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${C}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1000" height="1000" fill="url(#meshA)"/>
  <rect width="1000" height="1000" fill="url(#meshB)"/>
</svg>`;
}

writeFileSync(join(OUT, "continents-dots.svg"), generateContinentsDots());
writeFileSync(join(OUT, "world-wireframe.svg"), generateWorldWireframe());
writeFileSync(join(OUT, "routes.svg"), generateRoutes());
writeFileSync(join(OUT, "particles.svg"), generateParticles());
writeFileSync(join(OUT, "nodes.svg"), generateNodes());
writeFileSync(join(OUT, "radial-glow.svg"), generateRadialGlow());
writeFileSync(join(OUT, "gradient-mesh.svg"), generateGradientMesh());
// latitude-grid merged into world-wireframe; keep lightweight alias
writeFileSync(join(OUT, "latitude-grid.svg"), generateWorldWireframe());

console.log("Generated globe SVGs in", OUT);
