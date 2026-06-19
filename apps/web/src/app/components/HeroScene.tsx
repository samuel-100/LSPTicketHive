"use client";

import { useEffect, useRef } from "react";

// A slowly rotating 3D sphere of points (a "globe" of dots) with true
// perspective depth — points nearer the camera are larger and brighter,
// giving a real 3D feel rather than the old flat 2D network.
interface P3 { x: number; y: number; z: number; }

export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    let points: P3[] = [];
    const NUM = 320;       // points on the sphere
    let angle = 0;

    function build() {
      // Distribute points evenly on a sphere (Fibonacci sphere).
      points = [];
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < NUM; i++) {
        const y = 1 - (i / (NUM - 1)) * 2;       // -1 .. 1
        const r = Math.sqrt(1 - y * y);
        const theta = golden * i;
        points.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
      }
    }

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    function animate() {
      if (!canvas || !ctx) return;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.42;   // sphere screen radius
      const persp = 2.2;                       // perspective strength

      angle += 0.0022;
      const sinA = Math.sin(angle);
      const cosA = Math.cos(angle);
      const tilt = 0.5; // fixed tilt so the poles aren't dead-on

      // Project + sort back-to-front so nearer dots draw on top.
      const projected = points.map((p) => {
        // Rotate around Y axis.
        const x1 = p.x * cosA - p.z * sinA;
        const z1 = p.x * sinA + p.z * cosA;
        // Slight tilt around X axis.
        const y1 = p.y * Math.cos(tilt) - z1 * Math.sin(tilt);
        const z2 = p.y * Math.sin(tilt) + z1 * Math.cos(tilt);
        const scale = persp / (persp + z2); // depth → size/brightness
        return {
          sx: cx + x1 * radius * scale,
          sy: cy + y1 * radius * scale,
          depth: (z2 + 1) / 2,  // 0 (far) .. 1 (near)
          scale,
        };
      });
      projected.sort((a, b) => a.depth - b.depth);

      for (const p of projected) {
        const size = 0.6 + p.depth * 2.4;
        const alpha = 0.12 + p.depth * 0.65;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    }

    build();
    resize();
    animate();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <canvas ref={canvasRef} className="w-full h-full" style={{ display: "block" }} />
      {/* Soft glow behind the globe + fade into the page background */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-brand-500/10 blur-[90px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/30 via-transparent to-[#0a0a0a]" />
    </div>
  );
}
