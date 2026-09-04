"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Toast = { id: number; text: string; kind: "ok" | "err" };
export function toast(text: string, kind: "ok" | "err" = "ok") {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("anipins:toast", { detail: { text, kind } }));
}

export default function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const h = (e: Event) => {
      const { text, kind } = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setItems(t => [...t, { id, text, kind }]);
      setTimeout(() => setItems(t => t.filter(x => x.id !== id)), 3200);
    };
    window.addEventListener("anipins:toast", h);
    return () => window.removeEventListener("anipins:toast", h);
  }, []);
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[120] flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence>
        {items.map(t => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.25 }}
            className={`glass hairline rounded-full px-5 py-2.5 text-sm shadow-2xl ${t.kind === "ok" ? "border-gold/30 text-paper" : "border-red-500/40 text-red-300"}`}>
            {t.kind === "ok" ? <span className="mr-1.5 text-gold">✓</span> : <span className="mr-1.5">⚠</span>}{t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
