"use client";
import { useRef } from "react";

export default function Tilt({ children, max = 4, className = "" }: { children: React.ReactNode; max?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef<number>();

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(800px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateZ(4px)`;
    });
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) translateZ(0)";
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      className={`tilt transition-transform duration-200 ease-out ${className}`}>
      {children}
    </div>
  );
}
