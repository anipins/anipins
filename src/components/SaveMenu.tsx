"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "./Toaster";
import { haptic, rememberArtwork } from "@/lib/native";

export default function SaveMenu({ artworkId, onClose }: { artworkId: number; onClose: () => void }) {
  const [cols, setCols] = useState<any[]>([]);
  const [guest, setGuest] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/collections").then(r => r.json()).then(d => { setCols(d.collections || []); setGuest(!!d.guest); });
  }, []);

  const save = async (collectionId?: number) => {
    setBusy(true);
    const r = await fetch("/api/saves", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artworkId, collectionId }) });
    setBusy(false);
    if (r.status === 401) { router.push("/login"); return; }
    haptic("success"); rememberArtwork(artworkId, "saved"); toast("Saved to collection");
    onClose();
  };

  const createAndSave = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    const r = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
    const d = await r.json();
    if (d.id) await save(d.id); else setBusy(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-panel hairline p-5 shadow-2xl">
        <h3 className="font-display text-lg font-medium">Save to collection</h3>
        {guest ? (
          <div className="mt-4 text-sm text-fog">
            Sign in to save artwork and build collections.
            <button onClick={() => router.push("/login")} className="btn-primary mt-4 w-full">Sign in</button>
          </div>
        ) : (
          <>
            <div className="mt-4 max-h-56 space-y-1.5 overflow-y-auto pr-1">
              <button disabled={busy} onClick={() => save()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5 hairline">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-soft text-fog">♡</span> Saved (default)
              </button>
              {cols.map(c => (
                <button key={c.id} disabled={busy} onClick={() => save(c.id)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5 hairline">
                  {c.cover ? <img src={`/api/img/${c.cover}`} className="h-9 w-9 rounded-lg object-cover" alt="" /> : <span className="grid h-9 w-9 place-items-center rounded-lg bg-soft text-fog">▦</span>}
                  <span className="flex-1 text-left">{c.name}</span>
                  <span className="text-xs text-fog">{c.count}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New collection name" className="input flex-1 !py-2.5" />
              <button disabled={busy || !newName.trim()} onClick={createAndSave} className="btn-primary !px-4 !py-2.5 disabled:opacity-40">Create</button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
