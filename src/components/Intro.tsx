"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function Intro() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("anipins_intro")) return;
    sessionStorage.setItem("anipins_intro", "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 1600);
    return () => clearTimeout(t);
  }, []);
  const stroke = { strokeDasharray: 300, strokeDashoffset: 300 };
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}>
          <svg viewBox="0 0 120 120" className="h-24 w-24">
            <defs>
              <linearGradient id="ig" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#D4AF37"/><stop offset="1" stopColor="#9C7B3C"/>
              </linearGradient>
            </defs>
            {["M28 92 L52 30 L64 30", "M36 72 L58 72", "M64 30 L64 92", "M64 30 L74 30 A17 17 0 0 1 74 64 L64 64"].map((d, i) => (
              <motion.path key={i} d={d} fill="none" stroke="url(#ig)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
                initial={stroke} animate={{ strokeDashoffset: 0 }} transition={{ duration: 0.7, delay: 0.1 + i * 0.12, ease: "easeInOut" }} />
            ))}
            <motion.circle cx="91" cy="47" r="4" fill="#D4AF37" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.75, duration: 0.3 }} />
          </svg>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-5 font-display text-2xl font-semibold tracking-tight">Ani<span className="text-gold">Pins</span></motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.7, duration: 0.6, ease: "easeInOut" }}
            className="mt-4 h-px w-32 origin-center bg-gold/50" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
