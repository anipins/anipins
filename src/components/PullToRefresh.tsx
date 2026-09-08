"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 62;

export default function PullToRefresh() {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);
  const distanceRef = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const onStart = (event: TouchEvent) => {
      if (window.scrollY <= 0 && !refreshing) {
        startY.current = event.touches[0].clientY;
        active.current = true;
      }
    };
    const onMove = (event: TouchEvent) => {
      if (!active.current) return;
      const delta = event.touches[0].clientY - startY.current;
      if (delta <= 0) { distanceRef.current = 0; setDistance(0); return; }
      if (window.scrollY > 0) { active.current = false; return; }
      event.preventDefault();
      const next = Math.min(92, delta * 0.45);
      distanceRef.current = next;
      setDistance(next);
    };
    const onEnd = async () => {
      if (!active.current) return;
      active.current = false;
      if (distanceRef.current >= THRESHOLD) {
        setRefreshing(true);
        setDistance(52);
        window.dispatchEvent(new CustomEvent("anipins:refresh"));
        router.refresh();
        await new Promise(resolve => setTimeout(resolve, 850));
        setRefreshing(false);
      }
      distanceRef.current = 0;
      setDistance(0);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [refreshing, router]);

  if (distance === 0 && !refreshing) return null;
  const ready = distance >= THRESHOLD;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex justify-center md:hidden"
      style={{ transform: `translateY(${Math.max(-44, distance - 52)}px)` }} aria-live="polite">
      <div className="flex h-11 items-center gap-2 rounded-full bg-panel px-4 text-xs text-fog hairline shadow-xl">
        <svg className={`h-4 w-4 text-gold ${refreshing ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: `rotate(${Math.min(180, distance * 2.5)}deg)` }}>
          <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {refreshing ? "Loading new artwork…" : ready ? "Release to refresh" : "Pull for new artwork"}
      </div>
    </div>
  );
}
