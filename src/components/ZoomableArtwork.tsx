"use client";
import { useRef, useState } from "react";
import { haptic } from "@/lib/native";

export default function ZoomableArtwork({ src, alt, onSwipe, className = "max-h-[80vh] w-full" }: { src: string; alt: string; onSwipe?: (direction: "prev" | "next") => void; className?: string }) {
  const [scale,setScale]=useState(1),[point,setPoint]=useState({x:0,y:0});
  const gesture=useRef<any>({});
  const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
  const touchStart=(e:React.TouchEvent)=>{e.stopPropagation();if(e.touches.length===2){const [a,b]=[e.touches[0],e.touches[1]];gesture.current={distance:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),scale};}else{gesture.current={x:e.touches[0].clientX,y:e.touches[0].clientY,point,time:Date.now()};}};
  const touchMove=(e:React.TouchEvent)=>{e.stopPropagation();if(e.touches.length===2&&gesture.current.distance){e.preventDefault();const [a,b]=[e.touches[0],e.touches[1]];setScale(clamp(gesture.current.scale*Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/gesture.current.distance,1,5));}else if(scale>1&&e.touches.length===1&&gesture.current.x!==undefined){e.preventDefault();setPoint({x:gesture.current.point.x+e.touches[0].clientX-gesture.current.x,y:gesture.current.point.y+e.touches[0].clientY-gesture.current.y});}};
  const touchEnd=(e:React.TouchEvent)=>{e.stopPropagation();if(scale===1&&gesture.current.x!==undefined&&e.changedTouches[0]){const dx=e.changedTouches[0].clientX-gesture.current.x;if(Math.abs(dx)>70)onSwipe?.(dx>0?"prev":"next");}gesture.current={};};
  const toggle=()=>{haptic();if(scale>1){setScale(1);setPoint({x:0,y:0});}else setScale(2.5);};
  return <div className="relative h-full w-full touch-none overflow-hidden" onTouchStart={touchStart} onTouchMove={touchMove} onTouchEnd={touchEnd} onDoubleClick={toggle}>
    <img src={src} alt={alt} draggable={false} className={`${className} select-none object-contain transition-transform duration-150`} style={{transform:`translate(${point.x}px,${point.y}px) scale(${scale})`}} />
    <button type="button" onClick={toggle} className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-2 text-xs text-white backdrop-blur">{scale>1?"Reset":"Zoom"}</button>
    {scale>1&&<span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] text-white">{scale.toFixed(1)}× · drag to move</span>}
  </div>;
}
