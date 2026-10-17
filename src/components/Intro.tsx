"use client";

import { useLayoutEffect, useState } from "react";

const INTRO_DURATION_MS = 3200;
const EXIT_FADE_MS = 220;
const REDUCED_MOTION_INTRO_DURATION_MS = 900;

export default function Intro() {
  const [show, setShow] = useState(true);
  const [closing, setClosing] = useState(false);

  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reducedMotion ? REDUCED_MOTION_INTRO_DURATION_MS : INTRO_DURATION_MS;
    const closeTimer = window.setTimeout(() => setClosing(true), duration - EXIT_FADE_MS);
    const removeTimer = window.setTimeout(() => setShow(false), duration);
    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={`intro-splash${closing ? " intro-splash--closing" : ""}`} aria-label="AniPins" role="status">
      <div className="intro-splash__lockup">
        <img
          src="/brand/ap-symbol-intro.png?v=gold-20261016"
          alt=""
          className="intro-logo-mark"
          width="104"
          height="104"
          fetchPriority="high"
          draggable={false}
        />
        <div className="intro-splash__copy">
          <div className="intro-splash__wordmark-wrap">
            <p className="intro-splash__wordmark" aria-label="AniPins">Ani<span>Pins</span></p>
            <span className="intro-splash__wordmark-glint" aria-hidden="true" />
          </div>
          <p className="intro-splash__tagline">Discover <i>·</i> Save <i>·</i> Create</p>
        </div>
      </div>
    </div>
  );
}
