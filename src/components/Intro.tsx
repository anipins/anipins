"use client";
import dynamic from "next/dynamic";
import { useCallback, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const CinematicIntroScene = dynamic(() => import("./CinematicIntroScene"), { ssr: false });
const brandLetters = ["A", "n", "i", "P", "i", "n", "s"];

export default function Intro() {
  const [show, setShow] = useState(true);
  const [enhanced, setEnhanced] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const markSceneReady = useCallback(() => setSceneReady(true), []);

  useLayoutEffect(() => {
    // Cover the first WebView paint so the gallery never flashes before branding.
    if (sessionStorage.getItem("anipins_intro")) { setShow(false); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem("anipins_intro", "1"); setShow(false); return;
    }
    sessionStorage.setItem("anipins_intro", "1");
    setEnhanced(true);
    // The route continues loading behind the reveal. Five seconds gives the
    // construction-lines → rotating mark → archive handoff enough room to read.
    const timeout = window.setTimeout(() => setShow(false), 5000);
    return () => window.clearTimeout(timeout);
  }, []);

  return <AnimatePresence>
    {show && <motion.div className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#030405]"
      exit={{ opacity: 0, transition: { duration: .46, ease: [0.22, 1, .36, 1] } }}>
      <div className="absolute inset-0 intro-cinematic-vignette" aria-hidden="true" />
      <div className="relative grid h-[min(78vw,31rem)] w-[min(96vw,38rem)] place-items-center">
        {enhanced && <CinematicIntroScene onReady={markSceneReady} />}
        <img src="/brand/ap-symbol-intro.png" alt="" aria-hidden="true" className={`intro-scene-fallback ${sceneReady ? "opacity-0" : "opacity-100"}`} />
      </div>
      <motion.div className="pointer-events-none absolute bottom-[14vh] text-center"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.76, duration: .38 }}>
        <p className="flex justify-center font-display text-2xl font-semibold tracking-tight sm:text-3xl" aria-label="AniPins">
          {brandLetters.map((letter, index) => <span key={`${letter}-${index}`} className={index > 2 ? "text-gold" : "text-paper"}>{letter}</span>)}
        </p>
        <motion.div className="mx-auto mt-3 h-px w-40 origin-center bg-gold/70" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 1.96, duration: .44, ease: "easeOut" }} />
        <p className="mt-3 text-[9px] uppercase tracking-[.48em] text-fog">Visual archive / 01</p>
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}
