"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const GOLD = new THREE.Color("#d4ae5d");
const IVORY = new THREE.Color("#fff1ca");

function createLineGeometry(points: number[]) {
  return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(points), 3));
}

function FloatingMark({ position, rotation, scale, opacity }: { position: [number, number, number]; rotation: [number, number, number]; scale: number; opacity: number }) {
  const texture = useLoader(THREE.TextureLoader, "/brand/ap-symbol-transparent.png");
  const mark = useRef<THREE.Mesh>(null);
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 2; }, [texture]);
  useFrame(({ clock }) => {
    if (!mark.current) return;
    const time = clock.getElapsedTime();
    mark.current.rotation.z = rotation[2] + Math.sin(time * .35 + position[0]) * .08;
    mark.current.position.y = position[1] + Math.cos(time * .42 + position[0]) * .12;
  });
  return <mesh ref={mark} position={position} rotation={rotation} scale={[scale, scale, 1]}>
    <planeGeometry args={[1, 1]} />
    <meshBasicMaterial map={texture} color={GOLD} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
  </mesh>;
}

function ArchitecturalField() {
  const rear = useRef<THREE.Group>(null);
  const middle = useRef<THREE.Group>(null);
  const front = useRef<THREE.Group>(null);
  const scrollY = useRef(0);
  const rearLines = useMemo(() => createLineGeometry([
    -7,-4,-3, 0,6,-3, 0,6,-3, 7,-4,-3, 7,-4,-3, -7,-4,-3,
    -6,4,-2.8, 6,-4,-2.8, -6,-4,-2.8, 6,4,-2.8,
    -7,0,-2.5, 7,0,-2.5, 0,-5,-2.5, 0,5,-2.5,
  ]), []);
  const frameLines = useMemo(() => createLineGeometry([
    -5,-3,-1.3, -1.2,3.8,-1.3, -1.2,3.8,-1.3, 2.2,-3,-1.3,
    5,3,-1.5, 1.2,-3.8,-1.5, 1.2,-3.8,-1.5, -2.2,3,-1.5,
    -5,1,-1.1, 5,-1,-1.1, -3.8,-3.8,-1.1, 3.8,3.8,-1.1,
  ]), []);

  useEffect(() => {
    const syncScroll = () => { scrollY.current = window.scrollY; };
    syncScroll();
    window.addEventListener("scroll", syncScroll, { passive: true });
    return () => window.removeEventListener("scroll", syncScroll);
  }, []);
  useEffect(() => () => { rearLines.dispose(); frameLines.dispose(); }, [rearLines, frameLines]);

  useFrame(({ camera, clock }) => {
    const scroll = scrollY.current * .001;
    const time = clock.getElapsedTime();
    // Each layer travels a different distance. The separation is what makes the
    // background read as a physical 3D space instead of a flat image texture.
    if (rear.current) {
      rear.current.rotation.y = scroll * .22 + time * .028;
      rear.current.rotation.x = -.12 + Math.sin(time * .16) * .035;
      rear.current.position.y = -scroll * .24;
    }
    if (middle.current) {
      middle.current.rotation.y = -.35 - scroll * .52 + Math.sin(time * .22) * .06;
      middle.current.rotation.z = Math.sin(scroll * .4) * .13;
      middle.current.position.y = -scroll * .58;
      middle.current.position.x = Math.sin(scroll * .45) * .52;
    }
    if (front.current) {
      front.current.rotation.y = .46 + scroll * .78;
      front.current.rotation.x = -.12 + Math.cos(scroll * .5) * .12;
      front.current.position.y = -scroll * .92;
      front.current.position.x = Math.cos(scroll * .35) * .35;
    }
    camera.position.x = Math.sin(scroll * .3) * .42;
    camera.position.y = Math.cos(scroll * .24) * .22;
    camera.lookAt(0, -scroll * .22, 0);
  });

  return <>
    <group ref={rear}>
      <lineSegments geometry={rearLines}><lineBasicMaterial color={GOLD} transparent opacity={.52} blending={THREE.AdditiveBlending} /></lineSegments>
      <mesh rotation={[.5, -.4, .18]} position={[0,.2,-3.2]}>
        <tetrahedronGeometry args={[4.25, 0]} /><meshBasicMaterial color="#9b702c" wireframe transparent opacity={.30} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
    <group ref={middle}>
      <lineSegments geometry={frameLines}><lineBasicMaterial color={IVORY} transparent opacity={.64} blending={THREE.AdditiveBlending} /></lineSegments>
      <mesh rotation={[Math.PI / 2.1, .28, -.38]} position={[0,.1,-1.85]}>
        <torusGeometry args={[2.55,.022,8,160]} /><meshStandardMaterial color={GOLD} emissive="#67430e" emissiveIntensity={1.1} metalness={.95} roughness={.24} transparent opacity={.72} />
      </mesh>
      <mesh rotation={[.36,.76,.08]} position={[.3,-.2,-1.7]}>
        <octahedronGeometry args={[2.38, 0]} /><meshBasicMaterial color={GOLD} wireframe transparent opacity={.54} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
    <group ref={front}>
      <mesh rotation={[Math.PI / 2.72,-.42,.62]} position={[0,-.25,-.72]}>
        <torusGeometry args={[1.72,.018,8,160]} /><meshStandardMaterial color={IVORY} emissive="#5b3d10" emissiveIntensity={.85} metalness={.95} roughness={.18} transparent opacity={.62} />
      </mesh>
      <FloatingMark position={[-3.75, 1.95, -.2]} rotation={[-.08,.48,-.45]} scale={1.05} opacity={.62} />
      <FloatingMark position={[3.65, -1.75, -.1]} rotation={[.14,-.56,.38]} scale={.9} opacity={.46} />
    </group>
  </>;
}

export default function HomeDepthScene() {
  return <div className="cinematic-home-depth" aria-hidden="true">
    <Canvas dpr={[1, 1.45]} gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }} camera={{ position: [0,0,6.7], fov: 42 }}>
      <ambientLight intensity={.14} />
      <pointLight color="#e5bd67" intensity={5.2} position={[-1.4, 2.5, 2.6]} distance={9} />
      <pointLight color="#fff1ca" intensity={2.2} position={[3.2, -1.6, 1.5]} distance={7} />
      <ArchitecturalField />
    </Canvas>
  </div>;
}
