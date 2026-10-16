"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// A brief, cinematic brand reveal, without video/WebGL on the first-paint path.
const INTRO_SESSION_KEY = "anipins_intro_cinematic_v1";
const INTRO_DURATION_MS = 2550;
const cinematicEase = [0.22, 1, 0.36, 1] as const;

const logoFragments = [
  { clipPath: "polygon(0 0, 53% 0, 46% 100%, 0 100%)", x: -112, y: 38, rotate: -22, delay: .1 },
  { clipPath: "polygon(47% 0, 100% 0, 100% 61%, 55% 68%)", x: 96, y: -76, rotate: 19, delay: .22 },
  { clipPath: "polygon(40% 44%, 100% 34%, 100% 100%, 32% 100%)", x: 76, y: 88, rotate: 15, delay: .34 },
];

const brandLetters = ["A", "n", "i", "P", "i", "n", "s"];

export default function Intro() {
  const pathname = usePathname();
  const [show, setShow] = useState(true);

  const dismiss = useCallback(() => {
    try { sessionStorage.setItem(INTRO_SESSION_KEY, "1"); } catch { /* private-mode storage can be unavailable */ }
    setShow(false);
  }, []);

  useLayoutEffect(() => {
    // Never hold up direct links to artwork or repeat the opening in a session.
    if (pathname !== "/") { setShow(false); return; }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alreadySeen = false;
    try { alreadySeen = sessionStorage.getItem(INTRO_SESSION_KEY) === "1"; } catch { /* fail open */ }
    if (alreadySeen || reducedMotion) { dismiss(); return; }

    setShow(true);
    const timeout = window.setTimeout(dismiss, INTRO_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [pathname, dismiss]);

  useEffect(() => {
    if (!show || pathname !== "/") return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = before;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [show, pathname, dismiss]);

  return (
    <AnimatePresence>
      {show && pathname === "/" && (
        <motion.div
          key="anipins-cinematic-intro"
          role="dialog"
          aria-modal="true"
          aria-labelledby="anipins-intro-heading"
          className="intro-cinematic fixed inset-0 z-[100] isolate flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: .38, ease: "easeInOut" } }}
        >
          <div className="intro-cinematic-vignette" aria-hidden="true" />
          <div className="intro-cinematic-atmosphere" aria-hidden="true" />
          <div className="intro-cinematic-grain" aria-hidden="true" />
          <div className="intro-cinematic-crosshair intro-cinematic-crosshair--left" aria-hidden="true" />
          <div className="intro-cinematic-crosshair intro-cinematic-crosshair--right" aria-hidden="true" />

          <button
            type="button"
            onClick={dismiss}
            aria-label="Skip AniPins introduction"
            className="intro-cinematic-skip"
          >
            Skip intro <span aria-hidden="true">↗</span>
          </button>

          <div className="intro-cinematic-content relative z-10 flex flex-col items-center text-center">
            <motion.p
              aria-hidden="true"
              className="intro-cinematic-eyebrow"
              initial={{ opacity: 0, y: -12, letterSpacing: ".65em" }}
              animate={{ opacity: .74, y: 0, letterSpacing: ".4em" }}
              transition={{ delay: .24, duration: .72, ease: cinematicEase }}
            >THE ART OF DISCOVERY</motion.p>

            <div className="intro-cinematic-logo-stage relative mt-6 flex items-center justify-center sm:mt-8">
              <motion.div
                className="intro-cinematic-halo absolute rounded-full"
                aria-hidden="true"
                initial={{ opacity: 0, scale: .5 }}
                animate={{ opacity: [0, .9, .35], scale: [0.5, 1.06, 1.18] }}
                transition={{ delay: .2, duration: 1.55, ease: "easeOut" }}
              />
              <motion.div
                className="intro-cinematic-orbit intro-cinematic-orbit--outer"
                aria-hidden="true"
                initial={{ opacity: 0, scale: .6, rotate: -64 }}
                animate={{ opacity: [0, .72, .3], scale: 1, rotate: 18 }}
                transition={{ delay: .22, duration: 1.5, ease: cinematicEase }}
              />
              <motion.div
                className="intro-cinematic-orbit intro-cinematic-orbit--inner"
                aria-hidden="true"
                initial={{ opacity: 0, scale: .75, rotate: 90 }}
                animate={{ opacity: [0, .62, .28], scale: 1, rotate: -12 }}
                transition={{ delay: .38, duration: 1.26, ease: cinematicEase }}
              />
              <div className="intro-emblem-perspective relative">
                <motion.div
                  className="intro-emblem-volume relative"
                  initial={{ scale: .55, opacity: 0, rotateX: 30, rotateY: -64, rotateZ: -11, z: -90 }}
                  animate={{ scale: [.55, 1.08, 1], opacity: 1, rotateX: 0, rotateY: 0, rotateZ: 0, z: 0 }}
                  transition={{ duration: 1.36, times: [0, .73, 1], ease: cinematicEase }}
                >
                  <img className="intro-emblem-edge intro-emblem-edge--deep" src="/brand/ap-symbol-intro.png" alt="" aria-hidden="true" draggable={false} />
                  <img className="intro-emblem-edge intro-emblem-edge--near" src="/brand/ap-symbol-intro.png" alt="" aria-hidden="true" draggable={false} />
                  {logoFragments.map((fragment) => (
                    <motion.img
                      key={fragment.clipPath}
                      className="intro-emblem-image intro-emblem-fragment"
                      src="/brand/ap-symbol-intro.png"
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      style={{ clipPath: fragment.clipPath }}
                      initial={{ opacity: 0, x: fragment.x, y: fragment.y, rotate: fragment.rotate, scale: .84, filter: "blur(9px)" }}
                      animate={{ opacity: [0, 1, 1, 0], x: 0, y: 0, rotate: 0, scale: 1, filter: "blur(0px)" }}
                      transition={{ delay: fragment.delay, duration: .96, times: [0, .3, .75, 1], ease: cinematicEase }}
                    />
                  ))}
                  <motion.img
                    className="intro-emblem-image intro-emblem-face"
                    src="/brand/ap-symbol-intro.png"
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    initial={{ opacity: 0, filter: "brightness(1.8) blur(9px)" }}
                    animate={{ opacity: 1, filter: "brightness(1) blur(0px)" }}
                    transition={{ delay: .91, duration: .46, ease: "easeOut" }}
                  />
                  <motion.div
                    className="intro-cinematic-light-sweep absolute inset-0"
                    aria-hidden="true"
                    initial={{ x: "-160%", opacity: 0 }}
                    animate={{ x: "165%", opacity: [0, .85, 0] }}
                    transition={{ delay: 1.01, duration: .7, ease: "easeInOut" }}
                  />
                </motion.div>
              </div>
            </div>

            <h2 id="anipins-intro-heading" className="sr-only">AniPins</h2>
            <div className="intro-cinematic-wordmark mt-5 flex" aria-hidden="true">
              {brandLetters.map((letter, index) => (
                <motion.span
                  key={index}
                  className={index >= 3 ? "intro-cinematic-wordmark-gold" : ""}
                  initial={{ opacity: 0, y: 25, rotateX: -75, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                  transition={{ delay: .9 + index * .062, duration: .52, ease: cinematicEase }}
                >{letter}</motion.span>
              ))}
            </div>

            <motion.div
              className="intro-cinematic-rule"
              aria-hidden="true"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: .8 }}
              transition={{ delay: 1.45, duration: .62, ease: cinematicEase }}
            />
            <motion.p
              className="intro-cinematic-tagline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.55, duration: .5 }}
            >Discover · Save · Create</motion.p>
          </div>

          <div className="intro-cinematic-bottom" aria-hidden="true">
            <span>ANIPINS / ORIGINAL ARTWORK ARCHIVE</span>
            <div className="intro-cinematic-progress"><span /></div>
            <span>EST. 2026</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
