"use client";
import { useRef, useState } from "react";
import { haptic } from "@/lib/native";

export default function ZoomableArtwork({ src, previewSrc, alt, onSwipe, className = "max-h-[80vh] w-full" }: { src: string; previewSrc?: string; alt: string; onSwipe?: (direction: "prev" | "next") => void; className?: string }) {
  const [scale,setScale]=useState(1),[point,setPoint]=useState({x:0,y:0}),[loadedSrc,setLoadedSrc]=useState("");
  const gesture=useRef<any>({});
  const loaded=loadedSrc===src;
  const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
  const touchStart=(e:React.TouchEvent)=>{e.stopPropagation();if(e.touches.length===2){const [a,b]=[e.touches[0],e.touches[1]];gesture.current={distance:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),scale};}else{gesture.current={x:e.touches[0].clientX,y:e.touches[0].clientY,point,time:Date.now()};}};
  const touchMove=(e:React.TouchEvent)=>{e.stopPropagation();if(e.touches.length===2&&gesture.current.distance){e.preventDefault();const [a,b]=[e.touches[0],e.touches[1]];setScale(clamp(gesture.current.scale*Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/gesture.current.distance,1,5));}else if(scale>1&&e.touches.length===1&&gesture.current.x!==undefined){e.preventDefault();setPoint({x:gesture.current.point.x+e.touches[0].clientX-gesture.current.x,y:gesture.current.point.y+e.touches[0].clientY-gesture.current.y});}};
  const touchEnd=(e:React.TouchEvent)=>{e.stopPropagation();if(scale===1&&gesture.current.x!==undefined&&e.changedTouches[0]){const dx=e.changedTouches[0].clientX-gesture.current.x;if(Math.abs(dx)>70)onSwipe?.(dx>0?"prev":"next");}gesture.current={};};
  const toggle=()=>{haptic();if(scale>1){setScale(1);setPoint({x:0,y:0});}else setScale(2.5);};
  const transform=`translate(${point.x}px,${point.y}px) scale(${scale})`;
  return <div className="relative h-full w-full touch-none overflow-hidden" onTouchStart={touchStart} onTouchMove={touchMove} onTouchEnd={touchEnd} onDoubleClick={toggle}>
    {previewSrc ? <img src={previewSrc} alt="" aria-hidden="true" draggable={false} className={`${className} select-none object-contain transition-[opacity,transform] duration-300 ${loaded?"opacity-0":"opacity-100"}`} style={{transform}} /> : null}
    <img src={src} alt={alt} draggable={false} decoding="async" fetchPriority="high" onLoad={()=>setLoadedSrc(src)} className={`${className} ${previewSrc?"absolute inset-0 mx-auto":""} select-none object-contain transition-[opacity,transform] duration-300 ${loaded||!previewSrc?"opacity-100":"opacity-0"}`} style={{transform}} />
    {!loaded&&previewSrc?<span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] text-white">Loading full quality…</span>:null}
    <button type="button" onClick={toggle} className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-2 text-xs text-white backdrop-blur">{scale>1?"Reset":"Zoom"}</button>
    {scale>1&&<span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] text-white">{scale.toFixed(1)}× · drag to move</span>}
  </div>;
}
