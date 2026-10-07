"use client";
import { useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const logoFragments = [
  {
    clipPath: "polygon(0 0, 53% 0, 46% 100%, 0 100%)",
    x: -92,
    y: 46,
    rotate: -20,
    delay: 0.14,
  },
  {
    clipPath: "polygon(47% 0, 100% 0, 100% 61%, 55% 68%)",
    x: 82,
    y: -62,
    rotate: 18,
    delay: 0.3,
  },
  {
    clipPath: "polygon(40% 44%, 100% 34%, 100% 100%, 32% 100%)",
    x: 58,
    y: 78,
    rotate: 14,
    delay: 0.46,
  },
];

const brandLetters = ["A", "n", "i", "P", "i", "n", "s"];

export default function Intro() {
  // Render the cover immediately. Starting it as false caused the server
  // feed to paint for one frame before the brand screen appeared in WebView.
  const [show, setShow] = useState(true);
  useLayoutEffect(() => {
    // A Google sign-in return reloads the Android WebView. The intro belongs
    // only to the first page of an app/browser session, never that auth return.
    if (sessionStorage.getItem("anipins_intro")) {
      setShow(false);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem("anipins_intro", "1");
      setShow(false);
      return;
    }
    sessionStorage.setItem("anipins_intro", "1");
    setShow(true);
    // Let the branded opening play at its intended pace. The initial cover is
    // already rendered before the feed, so this is not a loading delay.
    const t = setTimeout(() => setShow(false), 1750);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}>
          <div className="relative flex items-center justify-center">
            <motion.div
              className="absolute h-64 w-64 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(198,161,91,0.28) 0%, rgba(198,161,91,0.08) 45%, transparent 70%)" }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1.15 }}
              transition={{ delay: 0.12, duration: 0.82, ease: "easeOut" }}
            />
            <svg viewBox="0 0 160 160" className="absolute h-52 w-52 -rotate-90">
              <motion.circle cx="80" cy="80" r="76" fill="none" stroke="#C6A15B" strokeWidth="1"
                opacity="0.55" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 0.34, duration: 0.62, ease: "easeInOut" }} />
            </svg>
            <div className="relative h-32 w-32 sm:h-36 sm:w-36" aria-label="AniPins">
              {logoFragments.map((fragment) => (
                <motion.img
                  key={fragment.clipPath}
                  src="/brand/ap-symbol-intro.png"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-32 w-32 select-none object-contain sm:h-36 sm:w-36"
                  style={{ clipPath: fragment.clipPath }}
                  initial={{ opacity: 0, x: fragment.x, y: fragment.y, rotate: fragment.rotate, scale: 0.82, filter: "blur(6px)" }}
                  animate={{ opacity: [0, 1, 1, 0], x: 0, y: 0, rotate: 0, scale: 1, filter: "blur(0px)" }}
                  transition={{ delay: fragment.delay / 2, duration: 0.78, times: [0, 0.24, 0.7, 1], ease: [0.22, 1, 0.36, 1] }}
                  draggable={false}
                />
              ))}
              <motion.img
                src="/brand/ap-symbol-intro.png"
                alt="AniPins"
                className="absolute inset-0 h-32 w-32 select-none object-contain sm:h-36 sm:w-36"
                initial={{ opacity: 0, scale: 0.94, filter: "blur(5px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.66, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                draggable={false}
              />
            </div>
          </div>
          <p className="mt-6 flex font-display text-2xl font-semibold tracking-tight sm:text-3xl" aria-label="AniPins">
            {brandLetters.map((letter, index) => (
              <motion.span
                key={`${letter}-${index}`}
                aria-hidden="true"
                className={index > 2 ? "text-gold" : undefined}
                initial={{ opacity: 0, x: (index - 3) * 20, y: index % 2 ? -20 : 20, rotate: (index - 3) * 7 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                transition={{ delay: 0.72 + index * 0.045, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                {letter}
              </motion.span>
            ))}
          </p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.08, duration: 0.34, ease: "easeInOut" }}
            className="mt-4 h-px w-32 origin-center bg-gold/50" />
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.22, duration: 0.3 }}
            className="mt-3 text-[10px] uppercase tracking-[0.42em] text-fog">Discover · Save · Create</motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
