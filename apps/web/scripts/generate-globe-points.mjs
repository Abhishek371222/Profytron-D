/**
 * Pre-generates continent dot coordinates for the 3D marketplace globe.
 * Run: node scripts/generate-globe-points.mjs
 */
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { feature } from "topojson-client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../public/marketplace/globe/continent-points.json");

function pointInRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInFeature(lng, lat, featureGeom) {
  const { type, coordinates } = featureGeom;
  if (type === "Polygon") {
    if (!pointInRing(lng, lat, coordinates[0])) return false;
    for (let i = 1; i < coordinates.length; i++) {
      if (pointInRing(lng, lat, coordinates[i])) return false;
    }
    return true;
  }
  if (type === "MultiPolygon") {
    return coordinates.some((poly) => {
      if (!pointInRing(lng, lat, poly[0])) return false;
      for (let i = 1; i < poly.length; i++) {
        if (pointInRing(lng, lat, poly[i])) return false;
      }
      return true;
    });
  }
  return false;
}

const world = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then((r) => r.json());
const countries = feature(world, world.objects.countries);

const points = [];
const step = 0.75;

for (let lat = -58; lat <= 72; lat += step) {
  for (let lng = -180; lng < 180; lng += step) {
    for (const f of countries.features) {
      if (pointInFeature(lng, lat, f.geometry)) {
        const hash = Math.abs(Math.sin(lng * 12.9898 + lat * 78.233) * 43758.5453) % 1;
        points.push({
          lat: +lat.toFixed(2),
          lng: +lng.toFixed(2),
          size: 0.18 + hash * 0.22,
        });
        break;
      }
    }
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(points));
console.log(`Wrote ${points.length} continent points → ${OUT}`);
