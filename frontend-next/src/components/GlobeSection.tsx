"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const World = dynamic(
  () => import("@/components/ui/globe").then((m) => m.World),
  { ssr: false }
);

const globeConfig = {
  pointSize: 4,
  globeColor: "#062056",
  showAtmosphere: true,
  atmosphereColor: "#6c63ff",
  atmosphereAltitude: 0.15,
  emissive: "#062056",
  emissiveIntensity: 0.1,
  shininess: 0.9,
  polygonColor: "rgba(255,255,255,0.7)",
  ambientLight: "#38bdf8",
  directionalLeftLight: "#ffffff",
  directionalTopLight: "#ffffff",
  pointLight: "#ffffff",
  arcTime: 1000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
  initialPosition: { lat: 22.3, lng: 78.9 },
  autoRotate: true,
  autoRotateSpeed: 0.5,
};

const arcColors = ["#6c63ff", "#a78bfa", "#8b83ff", "#c4b5fd"];

const trialArcs = [
  { order: 1, startLat: 28.6, startLng: 77.2, endLat: 40.7, endLng: -74.0, arcAlt: 0.3, color: arcColors[0] },
  { order: 2, startLat: 51.5, startLng: -0.12, endLat: 35.6, endLng: 139.6, arcAlt: 0.35, color: arcColors[1] },
  { order: 3, startLat: -33.8, startLng: 151.2, endLat: 1.35, endLng: 103.8, arcAlt: 0.2, color: arcColors[2] },
  { order: 4, startLat: 48.8, startLng: 2.35, endLat: -23.5, endLng: -46.6, arcAlt: 0.4, color: arcColors[3] },
  { order: 5, startLat: 37.7, startLng: -122.4, endLat: 55.7, endLng: 37.6, arcAlt: 0.35, color: arcColors[0] },
  { order: 6, startLat: 19.0, startLng: 72.8, endLat: 52.5, endLng: 13.4, arcAlt: 0.25, color: arcColors[1] },
  { order: 7, startLat: 39.9, startLng: 116.3, endLat: -34.6, endLng: -58.3, arcAlt: 0.45, color: arcColors[2] },
  { order: 8, startLat: 43.6, startLng: -79.3, endLat: 25.2, endLng: 55.2, arcAlt: 0.3, color: arcColors[3] },
  { order: 9, startLat: 22.3, startLng: 114.1, endLat: 41.9, endLng: 12.5, arcAlt: 0.3, color: arcColors[0] },
  { order: 10, startLat: 59.3, startLng: 18.0, endLat: 13.7, endLng: 100.5, arcAlt: 0.35, color: arcColors[1] },
  { order: 11, startLat: 40.7, startLng: -74.0, endLat: 28.6, endLng: 77.2, arcAlt: 0.3, color: arcColors[2] },
  { order: 12, startLat: 35.6, startLng: 139.6, endLat: 48.8, endLng: 2.35, arcAlt: 0.25, color: arcColors[3] },
];

export default function GlobeSection() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="relative w-full h-full flex items-center justify-center"
    >
      {/* Glow backdrop */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[400px] h-[400px] rounded-full bg-[var(--accent)]/10 blur-[80px]" />
      </div>

      {/* Globe */}
      <div className="w-full h-full">
        <World globeConfig={globeConfig} data={trialArcs} />
      </div>

      {/* Floating label */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 glass px-4 py-2 rounded-full"
      >
        <span className="text-xs text-[var(--text-secondary)]">
          🌐 20+ countries • Live trial locations
        </span>
      </motion.div>
    </motion.div>
  );
}
