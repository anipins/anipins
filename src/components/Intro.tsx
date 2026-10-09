"use client";

import dynamic from "next/dynamic";
import { useCallback, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const CinematicIntroScene = dynamic(() => import("./CinematicIntroScene"), { ssr: false });

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
    const timeout = window.setTimeout(() => setShow(false), 2700);
    return () => window.clearTimeout(timeout);
  }, []);

  return <AnimatePresence>
    {show && <motion.div className="intro-reference-stage fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-black"
      exit={{ opacity: 0, transition: { duration: .34, ease: [0.22, 1, .36, 1] } }}>
      <div className="relative h-full w-full">
        {enhanced && <CinematicIntroScene onReady={markSceneReady} />}
        <div className={`intro-scene-fallback-wrap ${sceneReady ? "opacity-0" : "opacity-100"}`}>
          <motion.img src="/brand/ap-symbol-transparent.png" alt="" aria-hidden="true" className="intro-scene-fallback"
            initial={{ opacity: 0, scale: .72 }} animate={{ opacity: 1, scale: [.72, 1, .94] }} transition={{ duration: .8, ease: [0.16, 1, .3, 1] }} />
        </div>
      </div>
    </motion.div>}
  </AnimatePresence>;
}
