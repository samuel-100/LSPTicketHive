"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";

function ParticleMesh() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const count = 100;
  const connectionDistance = 2.8;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 5;
      vel[i * 3] = (Math.random() - 0.5) * 0.004;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.004;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useEffect(() => {
    if (!pointsRef.current) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pointsRef.current.geometry = geometry;
  }, [positions]);

  useEffect(() => {
    if (!linesRef.current) return;
    linesRef.current.geometry = new THREE.BufferGeometry();
  }, []);

  useFrame(() => {
    if (!pointsRef.current || !linesRef.current) return;

    const posAttr = pointsRef.current.geometry.attributes.position;
    if (!posAttr) return;
    const pos = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3];
      pos[i * 3 + 1] += velocities[i * 3 + 1];
      pos[i * 3 + 2] += velocities[i * 3 + 2];

      if (Math.abs(pos[i * 3]) > 5) velocities[i * 3] *= -1;
      if (Math.abs(pos[i * 3 + 1]) > 4) velocities[i * 3 + 1] *= -1;
      if (Math.abs(pos[i * 3 + 2]) > 2.5) velocities[i * 3 + 2] *= -1;
    }
    posAttr.needsUpdate = true;

    const linePos: number[] = [];
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < connectionDistance) {
          linePos.push(
            pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2],
            pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]
          );
        }
      }
    }

    const lineGeom = new THREE.BufferGeometry();
    if (linePos.length > 0) {
      lineGeom.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    }
    linesRef.current.geometry.dispose();
    linesRef.current.geometry = lineGeom;

    pointsRef.current.rotation.y += 0.0002;
    linesRef.current.rotation.y += 0.0002;
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry />
        <pointsMaterial size={0.05} color="#22c55e" transparent opacity={0.9} sizeAttenuation />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#22c55e" transparent opacity={0.1} />
      </lineSegments>
    </>
  );
}

function FloatingOrb() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.4;
    ref.current.rotation.x = clock.getElapsedTime() * 0.15;
    ref.current.rotation.z = clock.getElapsedTime() * 0.08;
  });

  return (
    <mesh ref={ref} position={[0, 0, -1]}>
      <icosahedronGeometry args={[2, 1]} />
      <meshBasicMaterial color="#22c55e" wireframe transparent opacity={0.06} />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ParticleMesh />
        <FloatingOrb />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/30 via-transparent to-[#0a0a0a]" />
    </div>
  );
}
