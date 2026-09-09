"use client";
import { useEffect } from "react";

export default function ClientTelemetry(){useEffect(()=>{const send=(body:any)=>{try{navigator.sendBeacon("/api/telemetry",new Blob([JSON.stringify(body)],{type:"application/json"}));}catch{}};const loaded=()=>{const nav=performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming|undefined;if(nav)send({kind:"page-load",path:location.pathname,value:Math.round(nav.loadEventEnd-nav.startTime)});};const error=(e:ErrorEvent)=>send({kind:"client-error",path:location.pathname,detail:String(e.message||"error")});if(document.readyState==="complete")loaded();else window.addEventListener("load",loaded,{once:true});window.addEventListener("error",error);return()=>window.removeEventListener("error",error);},[]);return null;}
