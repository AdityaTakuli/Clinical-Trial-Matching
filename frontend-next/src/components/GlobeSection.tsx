"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

const World = dynamic(
  () => import("@/components/ui/globe").then((m) => m.World),
  { ssr: false }
);

const baseConfig = {
  pointSize: 4,
  showAtmosphere: true,
  atmosphereAltitude: 0.1,
  emissiveIntensity: 0.1,
  shininess: 0.9,
  directionalLeftLight: "#ffffff",
  directionalTopLight: "#ffffff",
  arcTime: 1000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
  initialPosition: { lat: 22.3, lng: 78.9 },
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

const darkGlobeConfig = {
  ...baseConfig,
  globeColor: "#1d072e",
  atmosphereColor: "#ffffff",
  emissive: "#000000",
  polygonColor: "rgba(255,255,255,0.7)",
  ambientLight: "#38bdf8",
  pointLight: "#ffffff",
};

const lightGlobeConfig = {
  ...baseConfig,
  globeColor: "#bfdcf5",
  atmosphereColor: "#7dd3fc",
  atmosphereAltitude: 0.12,
  emissive: "#cfe6fb",
  emissiveIntensity: 0.2,
  polygonColor: "rgba(30, 64, 175, 0.95)",
  ambientLight: "#ffffff",
  pointLight: "#ffffff",
};

const arcColors = ["#06b6d4", "#3b82f6", "#6366f1"];

const trialArcs = [
  { order: 1, startLat: 28.6, startLng: 77.2, endLat: 40.7, endLng: -74.0, arcAlt: 0.3, color: arcColors[0] },
  { order: 2, startLat: 51.5, startLng: -0.12, endLat: 35.6, endLng: 139.6, arcAlt: 0.35, color: arcColors[1] },
  { order: 3, startLat: -33.8, startLng: 151.2, endLat: 1.35, endLng: 103.8, arcAlt: 0.2, color: arcColors[2] },
  { order: 4, startLat: 48.8, startLng: 2.35, endLat: -23.5, endLng: -46.6, arcAlt: 0.4, color: arcColors[0] },
  { order: 5, startLat: 37.7, startLng: -122.4, endLat: 55.7, endLng: 37.6, arcAlt: 0.35, color: arcColors[1] },
  { order: 6, startLat: 19.0, startLng: 72.8, endLat: 52.5, endLng: 13.4, arcAlt: 0.25, color: arcColors[2] },
  { order: 7, startLat: 39.9, startLng: 116.3, endLat: -34.6, endLng: -58.3, arcAlt: 0.45, color: arcColors[0] },
  { order: 8, startLat: 43.6, startLng: -79.3, endLat: 25.2, endLng: 55.2, arcAlt: 0.3, color: arcColors[1] },
  { order: 9, startLat: 22.3, startLng: 114.1, endLat: 41.9, endLng: 12.5, arcAlt: 0.3, color: arcColors[2] },
  { order: 10, startLat: 59.3, startLng: 18.0, endLat: 13.7, endLng: 100.5, arcAlt: 0.35, color: arcColors[0] },
  { order: 11, startLat: 40.7, startLng: -74.0, endLat: 28.6, endLng: 77.2, arcAlt: 0.3, color: arcColors[1] },
  { order: 12, startLat: 35.6, startLng: 139.6, endLat: 48.8, endLng: 2.35, arcAlt: 0.25, color: arcColors[2] },
];

/**
 * Decide whether to render the heavy WebGL globe.
 * Phones and reduced-motion users get a lightweight CSS fallback so the
 * three.js chunk never downloads and the GPU isn't hammered.
 */
function useCanRenderGlobe(): boolean | null {
  const [canRender, setCanRender] = useState<boolean | null>(null);

  useEffect(() => {
    const evaluate = () => {
      const wideEnough = window.matchMedia("(min-width: 768px)").matches;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const cores = navigator.hardwareConcurrency ?? 4;
      setCanRender(wideEnough && !reducedMotion && cores >= 4);
    };

    evaluate();

    const mq = window.matchMedia("(min-width: 768px)");
    mq.addEventListener("change", evaluate);
    return () => mq.removeEventListener("change", evaluate);
  }, []);

  return canRender;
}

function StaticGlobe({ isLight }: { isLight: boolean }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-[min(70vw,260px)] aspect-square"
      >
        {/* Sphere */}
        <div
          className="absolute inset-0 rounded-full border border-[var(--border)]"
          style={{
            background: isLight
              ? "radial-gradient(circle at 32% 28%, #eaf2fe 0%, #bcd7f7 45%, #7fb0ef 100%)"
              : "radial-gradient(circle at 32% 28%, #24406e 0%, #14213d 55%, #0a0f1f 100%)",
            boxShadow: "0 18px 60px -20px var(--accent-glow)",
          }}
        />
        {/* Meridians / parallels */}
        <div
          className="absolute inset-0 rounded-full opacity-40"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent 0 22px, var(--accent-soft) 22px 23px), repeating-linear-gradient(90deg, transparent 0 22px, var(--accent-soft) 22px 23px)",
            maskImage: "radial-gradient(circle at 50% 50%, black 62%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(circle at 50% 50%, black 62%, transparent 72%)",
          }}
        />
        {/* Orbit ring */}
        <div className="absolute inset-[-8%] rounded-full border border-[var(--accent)]/25 animate-[spin_18s_linear_infinite]" />
        <span className="absolute top-1/2 left-[-2%] w-2 h-2 rounded-full bg-[var(--accent-light)] shadow-[0_0_12px_var(--accent-glow)]" />
      </motion.div>
    </div>
  );
}

export default function GlobeSection() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const canRenderGlobe = useCanRenderGlobe();

  useEffect(() => setMounted(true), []);

  const isLight = mounted && resolvedTheme === "light";
  const globeConfig = isLight ? lightGlobeConfig : darkGlobeConfig;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="relative w-full h-full flex items-center justify-center"
    >
      {/* Glow backdrop */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[min(420px,90%)] aspect-square rounded-full bg-[var(--accent)]/[0.12] blur-[90px]" />
      </div>

      {/* Globe — WebGL on capable devices, CSS fallback on phones */}
      <div className="w-full h-full">
        {canRenderGlobe === null ? null : canRenderGlobe ? (
          <World
            key={isLight ? "light" : "dark"}
            globeConfig={globeConfig}
            data={trialArcs}
          />
        ) : (
          <StaticGlobe isLight={isLight} />
        )}
      </div>

      {/* Floating label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[var(--bg-card)]/70 backdrop-blur-md border border-[var(--border)] max-w-[calc(100%-1.5rem)]"
      >
        <span className="text-[10px] sm:text-xs text-[var(--text-secondary)] flex items-center gap-2 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-light)] animate-pulse shrink-0" />
          20+ countries · Live trial locations
        </span>
      </motion.div>
    </motion.div>
  );
}
