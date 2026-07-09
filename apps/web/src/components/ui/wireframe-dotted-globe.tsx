"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { cn } from "@/lib/utils";

interface RotatingEarthProps {
  width?: number;
  height?: number;
  className?: string;
}

function readThemeColor(varName: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return value || fallback;
}

export default function RotatingEarth({ width = 800, height = 600, className }: RotatingEarthProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [size, setSize] = useState({ width, height });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const syncSize = () => {
      const w = Math.max(container.clientWidth, 1);
      const aspect = height / width;
      setSize({ width: w, height: Math.round(w * aspect) });
    };

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [width, height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let disposed = false;

    const containerWidth = Math.min(size.width, container.clientWidth || size.width);
    const containerHeight = Math.min(
      size.height,
      container.clientWidth ? container.clientWidth * (size.height / size.width) : size.height,
    );
    const radius = Math.min(containerWidth, containerHeight) / 2.4;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    context.scale(dpr, dpr);

    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90);

    const path = d3.geoPath().projection(projection).context(context);

    type LatLng = [number, number];

    const pointInRing = (point: LatLng, ring: number[][]): boolean => {
      const [x, y] = point;
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    };

    const pointInFeature = (point: LatLng, feature: GeoJSON.Feature): boolean => {
      const geometry = feature.geometry;
      if (geometry.type === "Polygon") {
        const coordinates = geometry.coordinates;
        if (!pointInRing(point, coordinates[0])) return false;
        for (let i = 1; i < coordinates.length; i += 1) {
          if (pointInRing(point, coordinates[i])) return false;
        }
        return true;
      }
      if (geometry.type === "MultiPolygon") {
        for (const polygon of geometry.coordinates) {
          if (pointInRing(point, polygon[0])) {
            let inHole = false;
            for (let i = 1; i < polygon.length; i += 1) {
              if (pointInRing(point, polygon[i])) {
                inHole = true;
                break;
              }
            }
            if (!inHole) return true;
          }
        }
        return false;
      }
      return false;
    };

    const generateDotsInFeature = (feature: GeoJSON.Feature, dotSpacing = 16): LatLng[] => {
      const dots: LatLng[] = [];
      const [[minLng, minLat], [maxLng, maxLat]] = d3.geoBounds(feature);
      const stepSize = dotSpacing * 0.08;
      for (let lng = minLng; lng <= maxLng; lng += stepSize) {
        for (let lat = minLat; lat <= maxLat; lat += stepSize) {
          const point: LatLng = [lng, lat];
          if (pointInFeature(point, feature)) dots.push(point);
        }
      }
      return dots;
    };

    const allDots: LatLng[] = [];
    let landFeatures: GeoJSON.FeatureCollection | null = null;

    const render = () => {
      const oceanFill = readThemeColor("--card", "#ffffff");
      const outline = readThemeColor("--card-border", "#e7ecef");
      const graticuleColor = readThemeColor("--muted-foreground", "#64707a");
      const dotColor = readThemeColor("--primary", "#348398");

      context.clearRect(0, 0, containerWidth, containerHeight);

      const currentScale = projection.scale();
      const scaleFactor = currentScale / radius;

      context.beginPath();
      context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI);
      context.fillStyle = oceanFill;
      context.fill();
      context.strokeStyle = outline;
      context.lineWidth = 1.5 * scaleFactor;
      context.stroke();

      if (landFeatures) {
        const graticule = d3.geoGraticule();
        context.beginPath();
        path(graticule());
        context.strokeStyle = graticuleColor;
        context.lineWidth = 0.6 * scaleFactor;
        context.globalAlpha = 0.18;
        context.stroke();
        context.globalAlpha = 1;

        context.beginPath();
        landFeatures.features.forEach((feature) => path(feature));
        context.strokeStyle = outline;
        context.lineWidth = 1 * scaleFactor;
        context.stroke();

        allDots.forEach(([lng, lat]) => {
          const projected = projection([lng, lat]);
          if (
            projected &&
            projected[0] >= 0 &&
            projected[0] <= containerWidth &&
            projected[1] >= 0 &&
            projected[1] <= containerHeight
          ) {
            context.beginPath();
            context.arc(projected[0], projected[1], 1.2 * scaleFactor, 0, 2 * Math.PI);
            context.fillStyle = dotColor;
            context.fill();
          }
        });
      }
    };

    const loadWorldData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/data/ne_110m_land.json");
        if (!response.ok) throw new Error("Failed to load land data");
        landFeatures = (await response.json()) as GeoJSON.FeatureCollection;

        landFeatures.features.forEach((feature) => {
          generateDotsInFeature(feature, 16).forEach((dot) => allDots.push(dot));
        });

        if (disposed) return;
        render();
        setIsLoading(false);
      } catch {
        if (disposed) return;
        setError("Failed to load globe data");
        setIsLoading(false);
      }
    };

    const rotation: [number, number, number] = [0, 0, 0];
    let autoRotate = true;
    const rotationSpeed = 0.35;

    const rotate = () => {
      if (autoRotate) {
        rotation[0] += rotationSpeed;
        projection.rotate(rotation);
        render();
      }
    };

    const rotationTimer = d3.timer(rotate);

    const handlePointerDown = (event: PointerEvent) => {
      autoRotate = false;
      const startX = event.clientX;
      const startY = event.clientY;
      const startRotation: [number, number, number] = [...rotation];

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const sensitivity = 0.5;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        rotation[0] = startRotation[0] + dx * sensitivity;
        rotation[1] = Math.max(-90, Math.min(90, startRotation[1] - dy * sensitivity));
        projection.rotate(rotation);
        render();
      };

      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.setTimeout(() => {
          autoRotate = true;
        }, 10);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(radius * 0.5, Math.min(radius * 3, projection.scale() * factor));
      projection.scale(newScale);
      render();
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    loadWorldData();

    return () => {
      disposed = true;
      rotationTimer.stop();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [size.width, size.height]);

  if (error) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "flex items-center justify-center rounded-[var(--radius-card)] border border-[var(--card-border)] bg-card p-8",
          className,
        )}
      >
        <div className="text-center">
          <p className="mb-1 text-sm font-semibold text-destructive">Couldn&apos;t load globe</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        className={cn(
          "h-auto w-full cursor-grab rounded-[var(--radius-card)] transition-opacity duration-300 active:cursor-grabbing",
          isLoading && "opacity-0",
        )}
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </div>
  );
}
