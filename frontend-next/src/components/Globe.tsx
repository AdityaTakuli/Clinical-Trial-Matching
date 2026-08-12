"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Sphere, OrbitControls, Line } from "@react-three/drei";
import * as THREE from "three";

const TRIAL_LOCATIONS = [
  { lat: 28.6, lng: 77.2, label: "Delhi" },
  { lat: 40.7, lng: -74.0, label: "New York" },
  { lat: 51.5, lng: -0.12, label: "London" },
  { lat: 35.6, lng: 139.6, label: "Tokyo" },
  { lat: -33.8, lng: 151.2, label: "Sydney" },
  { lat: 48.8, lng: 2.35, label: "Paris" },
  { lat: 55.7, lng: 37.6, label: "Moscow" },
  { lat: -23.5, lng: -46.6, label: "São Paulo" },
  { lat: 37.7, lng: -122.4, label: "San Francisco" },
  { lat: 1.35, lng: 103.8, label: "Singapore" },
  { lat: 19.0, lng: 72.8, label: "Mumbai" },
  { lat: 39.9, lng: 116.3, label: "Beijing" },
  { lat: 52.5, lng: 13.4, label: "Berlin" },
  { lat: 43.6, lng: -79.3, label: "Toronto" },
  { lat: -34.6, lng: -58.3, label: "Buenos Aires" },
  { lat: 25.2, lng: 55.2, label: "Dubai" },
  { lat: 22.3, lng: 114.1, label: "Hong Kong" },
  { lat: 41.9, lng: 12.5, label: "Rome" },
  { lat: 59.3, lng: 18.0, label: "Stockholm" },
  { lat: 13.7, lng: 100.5, label: "Bangkok" },
];

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

// Generate continent outline points from simplified coordinate data
function generateContinentPoints(): Float32Array {
  // Simplified continent outlines as [lat, lng] pairs
  const continents: [number, number][][] = [
    // North America outline
    [
      [49, -125], [50, -120], [53, -115], [58, -110], [60, -100], [55, -90],
      [50, -85], [45, -80], [43, -78], [42, -73], [40, -74], [35, -75],
      [30, -80], [25, -80], [20, -87], [15, -90], [10, -83], [8, -77],
      [25, -97], [30, -95], [30, -100], [32, -105], [35, -110], [37, -115],
      [40, -120], [45, -123], [48, -124],
    ],
    // South America
    [
      [10, -75], [5, -75], [0, -50], [-5, -35], [-10, -37], [-15, -40],
      [-20, -40], [-25, -45], [-30, -50], [-35, -55], [-40, -62], [-45, -65],
      [-50, -70], [-55, -68], [-50, -75], [-45, -73], [-40, -73], [-35, -72],
      [-30, -70], [-25, -70], [-20, -70], [-15, -75], [-10, -78], [-5, -80],
      [0, -78], [5, -77],
    ],
    // Europe
    [
      [36, -5], [38, 0], [40, 3], [43, 5], [45, 7], [47, 10], [48, 15],
      [50, 14], [52, 10], [54, 10], [55, 12], [57, 15], [60, 20], [63, 25],
      [65, 28], [68, 30], [70, 25], [65, 15], [62, 5], [58, 0], [55, -5],
      [50, -5], [48, -3], [44, -8], [40, -8], [37, -5],
    ],
    // Africa
    [
      [35, -5], [33, 0], [30, 10], [28, 15], [25, 30], [20, 35], [15, 40],
      [10, 45], [5, 42], [0, 42], [-5, 40], [-10, 40], [-15, 35], [-20, 35],
      [-25, 33], [-30, 30], [-34, 25], [-34, 20], [-30, 17], [-25, 15],
      [-20, 12], [-15, 12], [-10, 14], [-5, 10], [0, 10], [5, 5], [10, 0],
      [15, -15], [20, -17], [25, -15], [30, -10], [35, -5],
    ],
    // Asia
    [
      [40, 30], [42, 40], [45, 50], [50, 55], [55, 60], [60, 70], [65, 80],
      [68, 90], [70, 100], [68, 110], [65, 120], [60, 130], [55, 135],
      [50, 140], [45, 142], [40, 130], [35, 120], [30, 115], [25, 110],
      [20, 105], [15, 100], [10, 100], [5, 105], [0, 110], [-5, 115],
      [-8, 115], [0, 100], [5, 95], [10, 78], [15, 75], [20, 70],
      [25, 65], [30, 60], [35, 45], [38, 35], [40, 30],
    ],
    // Australia
    [
      [-12, 130], [-15, 125], [-20, 118], [-25, 115], [-30, 115], [-35, 117],
      [-37, 140], [-38, 145], [-35, 150], [-30, 153], [-25, 153], [-20, 148],
      [-15, 145], [-12, 140], [-12, 135], [-12, 130],
    ],
  ];

  const points: number[] = [];
  const radius = 2.005;

  for (const continent of continents) {
    // Interpolate between points for smoother outlines
    for (let i = 0; i < continent.length; i++) {
      const [lat1, lng1] = continent[i];
      const [lat2, lng2] = continent[(i + 1) % continent.length];

      const steps = 5;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const lat = lat1 + (lat2 - lat1) * t;
        const lng = lng1 + (lng2 - lng1) * t;
        const v = latLngToVector3(lat, lng, radius);
        points.push(v.x, v.y, v.z);
      }
    }

    // Fill interior with scattered dots
    const bounds = continent.reduce(
      (acc, [lat, lng]) => ({
        minLat: Math.min(acc.minLat, lat),
        maxLat: Math.max(acc.maxLat, lat),
        minLng: Math.min(acc.minLng, lng),
        maxLng: Math.max(acc.maxLng, lng),
      }),
      { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 }
    );

    for (let i = 0; i < 150; i++) {
      const lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
      const lng = bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng);
      const v = latLngToVector3(lat, lng, radius);
      points.push(v.x, v.y, v.z);
    }
  }

  return new Float32Array(points);
}

function ContinentOutlines() {
  const positions = useMemo(() => generateContinentPoints(), []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#4a9eff"
        sizeAttenuation
        transparent
        opacity={0.7}
      />
    </points>
  );
}

function GlobeGrid() {
  const geometry = useMemo(() => {
    const points: number[] = [];
    const radius = 2.003;

    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lng = 0; lng < 360; lng += 3) {
        const v = latLngToVector3(lat, lng - 180, radius);
        points.push(v.x, v.y, v.z);
      }
    }

    // Longitude lines
    for (let lng = -180; lng < 180; lng += 30) {
      for (let lat = -90; lat <= 90; lat += 3) {
        const v = latLngToVector3(lat, lng, radius);
        points.push(v.x, v.y, v.z);
      }
    }

    return new Float32Array(points);
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[geometry, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.006}
        color="#1e3a5f"
        sizeAttenuation
        transparent
        opacity={0.4}
      />
    </points>
  );
}

function GlowDot({ position, delay }: { position: THREE.Vector3; delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() + delay;
      const scale = 1 + 0.6 * Math.sin(t * 2.5);
      ref.current.scale.setScalar(scale);
    }
    if (ringRef.current) {
      const t = (clock.getElapsedTime() + delay) % 2.5;
      const scale = 1 + t * 1.2;
      ringRef.current.scale.setScalar(scale);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0,
        0.7 - t * 0.3
      );
    }
  });

  return (
    <group>
      {/* Core dot */}
      <mesh ref={ref} position={position}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshBasicMaterial color="#6c63ff" transparent opacity={0.95} />
      </mesh>
      {/* Outer glow */}
      <mesh position={position}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshBasicMaterial color="#6c63ff" transparent opacity={0.3} />
      </mesh>
      {/* Expanding ring */}
      <mesh ref={ringRef} position={position}>
        <ringGeometry args={[0.04, 0.06, 24]} />
        <meshBasicMaterial
          color="#a78bfa"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function ConnectionArcs() {
  const arcs = useMemo(() => {
    const connections: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    const pairs = [
      [0, 1], [1, 2], [2, 3], [3, 4], [5, 6], [7, 8], [9, 10], [11, 12],
    ];
    pairs.forEach(([a, b]) => {
      connections.push({
        start: latLngToVector3(TRIAL_LOCATIONS[a].lat, TRIAL_LOCATIONS[a].lng, 2.02),
        end: latLngToVector3(TRIAL_LOCATIONS[b].lat, TRIAL_LOCATIONS[b].lng, 2.02),
      });
    });
    return connections;
  }, []);

  return (
    <group>
      {arcs.map((arc, i) => {
        const mid = arc.start.clone().add(arc.end).multiplyScalar(0.5);
        mid.normalize().multiplyScalar(2.6);
        const curve = new THREE.QuadraticBezierCurve3(arc.start, mid, arc.end);
        const curvePoints = curve.getPoints(30);

        return (
          <Line
            key={i}
            points={curvePoints}
            color="#6c63ff"
            transparent
            opacity={0.25}
            lineWidth={1}
          />
        );
      })}
    </group>
  );
}

function AtmosphereGlow() {
  return (
    <Sphere args={[2.15, 64, 64]}>
      <meshBasicMaterial
        color="#1a3a6a"
        transparent
        opacity={0.08}
        side={THREE.BackSide}
      />
    </Sphere>
  );
}

function RotatingGlobe() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0015;
    }
  });

  const dots = useMemo(
    () =>
      TRIAL_LOCATIONS.map((loc, i) => ({
        position: latLngToVector3(loc.lat, loc.lng, 2.03),
        delay: i * 0.4,
      })),
    []
  );

  return (
    <group ref={groupRef}>
      {/* Ocean sphere */}
      <Sphere args={[2, 64, 64]}>
        <meshStandardMaterial
          color="#050a18"
          roughness={0.8}
          metalness={0.2}
        />
      </Sphere>

      {/* Atmosphere */}
      <AtmosphereGlow />

      {/* Grid lines */}
      <GlobeGrid />

      {/* Continent outlines */}
      <ContinentOutlines />

      {/* Connection arcs */}
      <ConnectionArcs />

      {/* Trial location dots */}
      {dots.map((dot, i) => (
        <GlowDot key={i} position={dot.position} delay={dot.delay} />
      ))}
    </group>
  );
}

export default function Globe() {
  return (
    <div className="w-full h-full overflow-visible">
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 40 }}
        style={{ background: "transparent", overflow: "visible" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={0.6} color="#4a9eff" />
        <directionalLight position={[-3, -2, -5]} intensity={0.3} color="#6c63ff" />
        <pointLight position={[0, 0, 5]} intensity={0.5} color="#ffffff" />
        <RotatingGlobe />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(2 * Math.PI) / 3}
        />
      </Canvas>
    </div>
  );
}
