"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const GOLD = new THREE.Color("#c6a15b");

function ArchitecturalField() {
  const field = useRef<THREE.Group>(null);
  const scrollY = useRef(0);
  const geometry = useMemo(() => new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array([
    -6,-4,-2, 0,5,-2, 0,5,-2, 6,-4,-2, 6,-4,-2, -6,-4,-2,
    -5,3,-1, 5,-3,-1, -5,-3,-1, 5,3,-1, -6,0,-1.4, 6,0,-1.4,
    -3,-5,-1.6, 3,5,-1.6, -3,5,-1.6, 3,-5,-1.6,
  ]), 3)), []);

  useEffect(() => {
    const syncScroll = () => { scrollY.current = window.scrollY; };
    syncScroll();
    window.addEventListener("scroll", syncScroll, { passive: true });
    return () => window.removeEventListener("scroll", syncScroll);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ camera, clock }) => {
    if (!field.current) return;
    const scroll = scrollY.current * .001;
    const time = clock.getElapsedTime();
    field.current.rotation.y = scroll * .42 + Math.sin(time * .12) * .06;
    field.current.rotation.x = -.16 + Math.cos(time * .1) * .025;
    field.current.position.y = -scroll * .7;
    field.current.position.x = Math.sin(scroll * .35) * .3;
    camera.position.x = Math.sin(scroll * .22) * .16;
    camera.position.y = Math.cos(scroll * .18) * .09;
    camera.lookAt(0, -scroll * .11, 0);
  });

  return <group ref={field}>
    <lineSegments geometry={geometry}><lineBasicMaterial color={GOLD} transparent opacity={.22} blending={THREE.AdditiveBlending} /></lineSegments>
    <mesh rotation={[Math.PI / 2.1, .28, -.38]} position={[0,.1,-1.8]}>
      <torusGeometry args={[2.15,.009,8,128]} /><meshStandardMaterial color="#c6a15b" emissive="#35230b" emissiveIntensity={.7} metalness={.95} roughness={.28} transparent opacity={.42} />
    </mesh>
    <mesh rotation={[Math.PI / 2.8,-.42,.62]} position={[0,-.25,-1.2]}>
      <torusGeometry args={[1.45,.007,8,128]} /><meshStandardMaterial color="#f1d99b" emissive="#3b280d" emissiveIntensity={.5} metalness={.95} roughness={.2} transparent opacity={.3} />
    </mesh>
  </group>;
}

export default function HomeDepthScene() {
  return <div className="cinematic-home-depth" aria-hidden="true">
    <Canvas dpr={[1, 1.35]} gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }} camera={{ position: [0,0,6.4], fov: 42 }}>
      <color attach="background" args={["#000000"]} />
      <ambientLight intensity={.08} />
      <pointLight color="#c6a15b" intensity={4.2} position={[0, 1.2, 2.2]} distance={8} />
      <ArchitecturalField />
    </Canvas>
  </div>;
}
