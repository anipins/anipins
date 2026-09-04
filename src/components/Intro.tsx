"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Intro() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("anipins_intro")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem("anipins_intro", "1");
      return;
    }
    sessionStorage.setItem("anipins_intro", "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 1700);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}>
          <div className="relative flex items-center justify-center">
            {/* soft gold aura behind the logo */}
            <motion.div
              className="absolute h-52 w-52 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(198,161,91,0.28) 0%, rgba(198,161,91,0.08) 45%, transparent 70%)" }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1.15 }}
              transition={{ duration: 1.1, ease: "easeOut" }}
            />
            {/* thin gold ring drawing itself around the logo */}
            <svg viewBox="0 0 160 160" className="absolute h-44 w-44 -rotate-90">
              <motion.circle cx="80" cy="80" r="76" fill="none" stroke="#C6A15B" strokeWidth="1"
                opacity="0.55" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 1.0, ease: "easeInOut" }} />
            </svg>
            {/* the logo itself */}
            <motion.img
              src="/brand/ap-symbol-intro.png" alt="AniPins"
              className="h-32 w-32 select-none"
              initial={{ opacity: 0, scale: 0.82, filter: "blur(6px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              draggable={false}
            />
          </div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-6 font-display text-2xl font-semibold tracking-tight">Ani<span className="text-gold">Pins</span></motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.7, duration: 0.6, ease: "easeInOut" }}
            className="mt-4 h-px w-32 origin-center bg-gold/50" />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-3 text-[10px] uppercase tracking-[0.4em] text-fog">Discover · Save · Create</motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
