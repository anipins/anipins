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
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}>
          <div className="intro-3d-scene relative flex h-80 w-80 items-center justify-center" style={{ perspective: "1000px" }}>
            <div className="intro-star-field" aria-hidden="true" />
            <motion.div
              className="absolute h-72 w-72 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(198,161,91,0.28) 0%, rgba(198,161,91,0.08) 45%, transparent 70%)" }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1.15 }}
              transition={{ delay: 0.12, duration: 0.82, ease: "easeOut" }}
            />
            <motion.div className="absolute h-72 w-72 rounded-full border border-gold/25"
              style={{ transform: "rotateX(70deg)" }} initial={{ opacity: 0, scale: .64, rotateZ: -24 }}
              animate={{ opacity: .9, scale: 1, rotateZ: 336 }} transition={{ delay: .18, duration: 1.35, ease: "easeOut" }} />
            <motion.div className="absolute h-60 w-60 rounded-full border border-gold/35"
              style={{ transform: "rotateY(66deg)" }} initial={{ opacity: 0, scale: .7, rotateZ: 25 }}
              animate={{ opacity: .78, scale: 1, rotateZ: -318 }} transition={{ delay: .27, duration: 1.42, ease: "easeOut" }} />
            <motion.div className="absolute h-48 w-48 rounded-full border border-gold/45"
              style={{ transform: "rotateX(42deg) rotateY(-42deg)" }} initial={{ opacity: 0, scale: .72 }}
              animate={{ opacity: .65, scale: 1, rotateZ: 245 }} transition={{ delay: .36, duration: 1.32, ease: "easeOut" }} />
            <motion.div className="intro-light-sweep absolute h-[26rem] w-12 -rotate-[28deg] bg-gradient-to-b from-transparent via-gold/45 to-transparent blur-[2px]"
              initial={{ opacity: 0, x: -180 }} animate={{ opacity: [0, .9, 0], x: [-180, 180, 280] }}
              transition={{ delay: .44, duration: 1.1, times: [0, .45, 1], ease: "easeInOut" }} />
            <motion.div className="intro-logo-depth relative h-32 w-32 sm:h-36 sm:w-36" aria-label="AniPins"
              style={{ transformStyle: "preserve-3d" }} initial={{ opacity: 0, rotateY: -58, rotateX: 24, z: -100, scale: .66 }}
              animate={{ opacity: 1, rotateY: [ -58, 18, 0 ], rotateX: [24, -8, 0], z: [-100, 30, 0], scale: [ .66, 1.06, 1 ] }}
              transition={{ delay: .28, duration: 1.18, times: [0, .72, 1], ease: [0.22, 1, 0.36, 1] }}>
              <img src="/brand/ap-symbol-intro.png" alt="" aria-hidden="true" className="absolute inset-0 h-32 w-32 select-none object-contain opacity-30 blur-md sm:h-36 sm:w-36" style={{ transform: "translateZ(-26px) scale(1.08)" }} draggable={false} />
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
            </motion.div>
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
