"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const logoFragments = [
  {
    clipPath: "polygon(0 0, 53% 0, 46% 100%, 0 100%)",
    x: -180,
    y: 92,
    rotate: -28,
    delay: 0.2,
  },
  {
    clipPath: "polygon(47% 0, 100% 0, 100% 61%, 55% 68%)",
    x: 168,
    y: -126,
    rotate: 26,
    delay: 0.42,
  },
  {
    clipPath: "polygon(40% 44%, 100% 34%, 100% 100%, 32% 100%)",
    x: 124,
    y: 154,
    rotate: 20,
    delay: 0.64,
  },
];

const brandLetters = ["A", "n", "i", "P", "i", "n", "s"];

export default function Intro() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const nativeApp = "AniPinsAndroid" in window;
    if (!nativeApp && sessionStorage.getItem("anipins_intro")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (!nativeApp) sessionStorage.setItem("anipins_intro", "1");
      return;
    }
    if (!nativeApp) sessionStorage.setItem("anipins_intro", "1");
    setShow(true);
    const t = setTimeout(() => setShow(false), 3900);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          exit={{ opacity: 0, transition: { duration: 0.65, ease: "easeInOut" } }}>
          <div className="relative flex items-center justify-center">
            <motion.div
              className="absolute h-[30rem] w-[30rem] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(198,161,91,0.28) 0%, rgba(198,161,91,0.08) 45%, transparent 70%)" }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1.15 }}
              transition={{ delay: 0.56, duration: 1.8, ease: "easeOut" }}
            />
            <svg viewBox="0 0 160 160" className="absolute h-80 w-80 -rotate-90">
              <motion.circle cx="80" cy="80" r="76" fill="none" stroke="#C6A15B" strokeWidth="1"
                opacity="0.55" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 1.15, duration: 1.35, ease: "easeInOut" }} />
            </svg>
            <div className="relative h-52 w-52 sm:h-60 sm:w-60" aria-label="AniPins">
              {logoFragments.map((fragment) => (
                <motion.img
                  key={fragment.clipPath}
                  src="/brand/ap-symbol-intro.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-52 w-52 select-none object-contain sm:h-60 sm:w-60"
                  style={{ clipPath: fragment.clipPath }}
                  initial={{ opacity: 0, x: fragment.x, y: fragment.y, rotate: fragment.rotate, scale: 0.74, filter: "blur(10px)" }}
                  animate={{ opacity: [0, 1, 1, 0], x: 0, y: 0, rotate: 0, scale: 1, filter: "blur(0px)" }}
                  transition={{ delay: fragment.delay, duration: 1.55, times: [0, 0.22, 0.72, 1], ease: [0.22, 1, 0.36, 1] }}
                  draggable={false}
                />
              ))}
              <motion.img
                src="/brand/ap-symbol-intro.png"
                alt="AniPins"
                className="absolute inset-0 h-52 w-52 select-none object-contain sm:h-60 sm:w-60"
                initial={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ delay: 1.65, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                draggable={false}
              />
            </div>
          </div>
          <p className="mt-9 flex font-display text-4xl font-semibold tracking-tight sm:text-5xl" aria-label="AniPins">
            {brandLetters.map((letter, index) => (
              <motion.span
                key={`${letter}-${index}`}
                aria-hidden="true"
                className={index > 2 ? "text-gold" : undefined}
                initial={{ opacity: 0, x: (index - 3) * 42, y: index % 2 ? -38 : 38, rotate: (index - 3) * 10 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                transition={{ delay: 1.72 + index * 0.09, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              >
                {letter}
              </motion.span>
            ))}
          </p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 2.4, duration: 0.7, ease: "easeInOut" }}
            className="mt-6 h-px w-48 origin-center bg-gold/50" />
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.62, duration: 0.5 }}
            className="mt-4 text-xs uppercase tracking-[0.42em] text-fog">Discover · Save · Create</motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
