"use client";
import { motion } from "framer-motion";
import { useState } from "react";

export default function ShareMenu({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent(url);
  const encT = encodeURIComponent(`${title} — AniPins`);
  const items = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encT}%20${enc}` },
    { label: "X / Twitter", href: `https://twitter.com/intent/tweet?text=${encT}&url=${enc}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
  ];
  const native = typeof navigator !== "undefined" && !!(navigator as any).share;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-panel hairline p-5 shadow-2xl">
        <h3 className="font-display text-lg font-medium">Share artwork</h3>
        <div className="mt-4 space-y-1.5">
          <button onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className="w-full rounded-xl px-4 py-3 text-left text-sm hairline hover:bg-white/5">
            {copied ? "✓ Link copied" : "Copy link"}
          </button>
          {items.map(i => (
            <a key={i.label} href={i.href} target="_blank" rel="noopener noreferrer"
              className="block w-full rounded-xl px-4 py-3 text-sm hairline hover:bg-white/5">{i.label}</a>
          ))}
          {native && (
            <button onClick={() => (navigator as any).share({ title, url }).catch(() => {})}
              className="w-full rounded-xl px-4 py-3 text-left text-sm hairline hover:bg-white/5">More options…</button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
