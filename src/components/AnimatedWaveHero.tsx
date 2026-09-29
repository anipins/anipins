"use client";

import { useEffect, useRef } from "react";

export default function AnimatedWaveHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let previous = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (now: number) => {
      // Keep this visual layer smooth without competing with image decoding or
      // the masonry feed. Mobile receives the same artwork at ~24fps.
      if (!motionReduced && now - previous < 42) { frame = requestAnimationFrame(draw); return; }
      previous = now;
      const time = motionReduced ? 0 : now / 1000;
      context.clearRect(0, 0, width, height);
      const start = width * 0.34;
      const gradient = context.createLinearGradient(start, 0, width, height);
      gradient.addColorStop(0, "rgba(198,161,91,0)");
      gradient.addColorStop(.52, "rgba(242,208,138,.72)");
      gradient.addColorStop(1, "rgba(198,161,91,.13)");

      const waves = [
        { y: .30, amplitude: .095, frequency: 1.75, speed: .40, width: 1.0, alpha: .40 },
        { y: .48, amplitude: .13, frequency: 1.2, speed: -.31, width: 1.25, alpha: .72 },
        { y: .68, amplitude: .12, frequency: 1.45, speed: .27, width: 1.0, alpha: .48 },
        { y: .82, amplitude: .08, frequency: 2.15, speed: -.20, width: .75, alpha: .26 },
      ];
      for (const wave of waves) {
        context.beginPath();
        for (let x = start; x <= width + 8; x += 10) {
          const normalized = (x - start) / (width - start);
          const rise = Math.pow(Math.max(0, normalized), .7);
          const y = height * wave.y + Math.sin(normalized * Math.PI * 2 * wave.frequency + time * wave.speed) * height * wave.amplitude * rise + Math.sin(normalized * Math.PI * 5 + time * wave.speed * .7) * height * .018 * rise;
          if (x === start) context.moveTo(x, y); else context.lineTo(x, y);
        }
        context.strokeStyle = gradient;
        context.globalAlpha = wave.alpha;
        context.lineWidth = wave.width;
        context.stroke();
      }
      context.globalAlpha = 1;
      for (let index = 0; index < 30; index += 1) {
        const progress = ((index * .137 + time * .018) % 1);
        const x = start + progress * (width - start);
        const y = height * (.28 + ((index * 37) % 55) / 100) + Math.sin(time * .9 + index) * 18;
        const radius = index % 5 === 0 ? 1.8 : .8;
        context.beginPath();
        context.fillStyle = index % 4 === 0 ? "rgba(242,208,138,.85)" : "rgba(198,161,91,.38)";
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      if (!motionReduced) frame = requestAnimationFrame(draw);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
