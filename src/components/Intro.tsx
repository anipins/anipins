"use client";
import dynamic from "next/dynamic";
import { useCallback, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const CinematicIntroScene = dynamic(() => import("./CinematicIntroScene"), { ssr: false });

function Blueprint() {
  return <svg className="intro-reference-blueprint" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <motion.path d="M216 930 800 66l584 864M420 930 800 366l380 564M260 160 1340 840M1340 160 260 840M72 500h1456M800 34v932"
      initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: .62 }} transition={{ duration: 1.35, ease: "easeInOut" }} />
    <motion.circle cx="800" cy="500" r="318" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: .28 }} transition={{ delay: .25, duration: 1.15, ease: "easeInOut" }} />
    <motion.circle cx="800" cy="500" r="438" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: .18 }} transition={{ delay: .34, duration: 1.2, ease: "easeInOut" }} />
  </svg>;
}

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
    {show && <motion.div className="intro-reference-stage fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#030405]"
      exit={{ opacity: 0, transition: { duration: .64, ease: [0.22, 1, .36, 1] } }}>
      <Blueprint />
      <div className="absolute inset-0 intro-cinematic-vignette" aria-hidden="true" />
      <motion.div className="intro-reference-flash" initial={{ opacity: 0, scaleX: .08 }} animate={{ opacity: [0, .9, 0], scaleX: [.08, 1.15, 1.34] }} transition={{ delay: 1.12, duration: .7, ease: "easeOut" }} aria-hidden="true" />
      <div className="relative h-full w-full">
        {enhanced && <CinematicIntroScene onReady={markSceneReady} />}
        <div className={`intro-scene-fallback-wrap ${sceneReady ? "opacity-0" : "opacity-100"}`}>
          <motion.img src="/brand/ap-symbol-transparent.png" alt="" aria-hidden="true" className="intro-scene-fallback"
            initial={{ opacity: 0, scale: .56, rotateY: -28, rotateX: 9 }} animate={{ opacity: 1, scale: [ .56, 1.04, .94 ], rotateY: [ -28, 4, 0 ], rotateX: [ 9, -2, 0 ] }} transition={{ duration: 1.8, ease: [0.16, 1, .3, 1] }} />
        </div>
      </div>
      <motion.div className="pointer-events-none absolute bottom-[9vh] text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.05, duration: .4 }}>
        <p className="text-[9px] uppercase tracking-[.62em] text-gold/70">AniPins / Visual archive</p>
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}
