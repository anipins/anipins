"use client";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const GOLD = new THREE.Color("#c6a15b");

function CameraMotion() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * .42) * .12;
    camera.position.y = Math.cos(t * .36) * .07;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

function ConstructionLines() {
  const ref = useRef<THREE.LineSegments>(null);
  const geometry = useMemo(() => new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array([
    -3.4,-2.8,-.9,1.2,2.8,-.9, -2.6,-2.8,-.65,2.6,2.8,-.65, -2.9,1.95,-.4,3.1,-1.95,-.4,
    -3.15,.85,-.5,3.15,-.85,-.5, -2.15,-2.55,-.2,2.05,2.55,-.2, -1.3,2.78,-.25,2.9,-1.95,-.25,
    -3.2,-.15,-.35,3.2,-.15,-.35, -2.7,2.35,-.5,1.65,-2.7,-.5, -1.7,-2.75,-.3,3.15,1.4,-.3,
    -3.1,1.5,-.45,1.72,2.8,-.45,
  ]), 3)), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.z = Math.sin(clock.getElapsedTime() * .45) * .055;
    ref.current.position.y = Math.sin(clock.getElapsedTime() * .32) * .035;
  });
  return <lineSegments ref={ref} geometry={geometry}><lineBasicMaterial color={GOLD} transparent opacity={.68} blending={THREE.AdditiveBlending} /></lineSegments>;
}

function BrandMark({ onReady }: { onReady?: () => void }) {
  const texture = useLoader(THREE.TextureLoader, "/brand/ap-symbol-intro.png");
  const group = useRef<THREE.Group>(null);
  const hasReportedReady = useRef(false);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    // Keep the DOM fallback visible until the WebGL texture has actually loaded.
    // A dynamic import can otherwise leave the opening sequence almost black.
    if (!hasReportedReady.current) {
      hasReportedReady.current = true;
      const frame = requestAnimationFrame(() => onReady?.());
      return () => cancelAnimationFrame(frame);
    }
  }, [onReady, texture]);
  useFrame(({ clock }) => {
    const t = Math.min(clock.getElapsedTime(), 3.4), settle = 1 - Math.exp(-t * 2.15);
    if (!group.current) return;
    group.current.rotation.y = THREE.MathUtils.lerp(-1.12, 0, settle) + Math.sin(t * 1.3) * .025;
    group.current.rotation.x = THREE.MathUtils.lerp(.36, 0, settle);
    group.current.position.z = THREE.MathUtils.lerp(-1.2, .18, settle);
    group.current.position.y = Math.sin(t * 1.5) * .025;
  });
  return <group ref={group}>
    {[[ -.18, 2.78, "#5c451c", .48 ],[-.08,2.58,"#a2762e",.76],[.06,2.38,"#fff7df",1]].map(([z, scale, color, opacity]) => <mesh key={String(z)} position={[0,0,Number(z)]} scale={[Number(scale),Number(scale),1]}><planeGeometry args={[1,1]} /><meshBasicMaterial map={texture} color={String(color)} transparent opacity={Number(opacity)} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>)}
  </group>;
}

function Scene({ onReady }: { onReady?: () => void }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => { if (light.current) light.current.intensity = 6 + Math.sin(clock.getElapsedTime() * 2.2) * 1.6; });
  return <>
    <color attach="background" args={["#030405"]} /><fog attach="fog" args={["#030405", 3, 8]} />
    <ambientLight intensity={.22} /><pointLight ref={light} color="#c6a15b" position={[0,.3,2]} distance={6} /><pointLight color="#f4ead1" intensity={1.2} position={[-2.4,.8,-1.5]} distance={5} />
    <ConstructionLines />
    <mesh rotation={[Math.PI / 2.2,0,-.3]} position={[0,0,-.58]}><torusGeometry args={[1.44,.009,8,120]} /><meshStandardMaterial color="#c6a15b" emissive="#50350d" emissiveIntensity={.9} metalness={.9} roughness={.28} /></mesh>
    <mesh rotation={[Math.PI / 2.95,.52,.65]} position={[0,0,-.42]}><torusGeometry args={[1.16,.007,8,120]} /><meshStandardMaterial color="#e3c078" emissive="#5b3d10" emissiveIntensity={.65} metalness={.92} roughness={.22} /></mesh>
    <BrandMark onReady={onReady} /><CameraMotion />
  </>;
}

export default function CinematicIntroScene({ onReady }: { onReady?: () => void }) {
  return <Canvas className="absolute inset-0" dpr={[1,1.5]} gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }} camera={{ position: [0,0,4.1], fov: 37 }}><Suspense fallback={null}><Scene onReady={onReady} /></Suspense></Canvas>;
}
