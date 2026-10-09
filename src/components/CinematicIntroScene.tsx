"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";

const LAYERS = Array.from({ length: 15 }, (_, index) => index);

function LogoVolume({ onReady }: { onReady?: () => void }) {
  const texture = useLoader(THREE.TextureLoader, "/brand/ap-symbol-transparent.png");
  const mark = useRef<THREE.Group>(null);
  const hasReportedReady = useRef(false);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    if (!hasReportedReady.current) {
      hasReportedReady.current = true;
      const frame = requestAnimationFrame(() => onReady?.());
      return () => cancelAnimationFrame(frame);
    }
  }, [onReady, texture]);

  useFrame(({ camera, clock }) => {
    if (!mark.current) return;
    const progress = Math.min(clock.getElapsedTime() / 2.25, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    // Fifteen physical depth slices and one camera orbit make the AniPins
    // mark dimensional, with no surrounding decoration.
    mark.current.rotation.y = THREE.MathUtils.lerp(-.88, .08, eased);
    mark.current.rotation.x = THREE.MathUtils.lerp(.22, -.03, eased);
    mark.current.rotation.z = THREE.MathUtils.lerp(.1, 0, eased);
    mark.current.position.z = THREE.MathUtils.lerp(-.35, 0, eased);
    camera.position.x = THREE.MathUtils.lerp(.42, .02, eased);
    camera.position.y = THREE.MathUtils.lerp(.12, 0, eased);
    camera.lookAt(0, 0, 0);
  });

  return <group ref={mark} scale={[1.38, 1.38, 1]}>
    {LAYERS.map((layer) => {
      const depth = -layer * .028;
      const front = layer === 0;
      return <mesh key={layer} position={[0, 0, depth]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={texture} color={front ? "#f5d889" : "#805717"} transparent opacity={front ? 1 : .94} depthWrite={false} blending={THREE.NormalBlending} />
      </mesh>;
    })}
  </group>;
}

function Scene({ onReady }: { onReady?: () => void }) {
  return <>
    <color attach="background" args={["#000000"]} />
    <LogoVolume onReady={onReady} />
  </>;
}

export default function CinematicIntroScene({ onReady }: { onReady?: () => void }) {
  return <Canvas className="absolute inset-0" dpr={[1, 1.5]} gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }} camera={{ position: [.42,.12,3.8], fov: 35 }}>
    <Suspense fallback={null}><Scene onReady={onReady} /></Suspense>
  </Canvas>;
}
