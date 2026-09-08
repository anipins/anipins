"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toaster";

export default function AdminUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [msg, setMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const addFiles = (list: FileList | File[]) => {
    const imgs = Array.from(list).filter(f => f.type.startsWith("image/"));
    setFiles(prev => [...prev, ...imgs]);
    imgs.forEach(f => {
      const r = new FileReader();
      r.onload = () => setPreviews(prev => [...prev, String(r.result)]);
      r.readAsDataURL(f);
    });
  };

  const removeAt = (i: number) => {
    setFiles(f => f.filter((_, j) => j !== i));
    setPreviews(p => p.filter((_, j) => j !== i));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!files.length) { setMsg("Add at least one image."); return; }
    setBusy(true); setUploadedCount(0); setMsg("");
    const fields = new FormData(e.currentTarget);
    let completed = 0;

    try {
      for (const file of files) {
        const fd = new FormData();
        fields.forEach((value, key) => fd.append(key, value));
        fd.append("files", file);

        const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `Upload failed for ${file.name}`);
        completed += d.ids?.length || 1;
        setUploadedCount(completed);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Upload failed";
      setMsg(completed > 0 ? `Published ${completed} of ${files.length}. ${reason}` : reason);
      if (completed > 0) {
        setFiles(current => current.slice(completed));
        setPreviews(current => current.slice(completed));
      }
      setBusy(false);
      return;
    }

    setBusy(false);
    setMsg(`✓ Published ${completed} artwork${completed > 1 ? "s" : ""}. Live everywhere now.`);
    toast(`${completed} artwork${completed > 1 ? "s" : ""} published successfully`);
    setFiles([]); setPreviews([]);
    formRef.current?.reset();
    router.refresh();
  };

  return (
    <form ref={formRef} onSubmit={submit} className="grid gap-8 lg:grid-cols-2">
      <div>
        <label className="label">Artwork Upload</label>
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`grid min-h-48 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${drag ? "border-paper bg-paper/5" : "border-paper/15 hover:border-paper/30"}`}>
          <div>
            <p className="text-sm">Drag & drop images here, or click to browse</p>
            <p className="mt-1 text-xs text-fog">Select one or multiple images · JPG / PNG / WebP</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={e => e.target.files && addFiles(e.target.files)} />
        </div>
        {previews.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {previews.map((p, i) => (
              <div key={i} className="group relative overflow-hidden rounded-xl">
                <img src={p} className="aspect-square w-full object-cover" alt="" />
                <button type="button" onClick={() => removeAt(i)}
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs opacity-0 transition-opacity group-hover:opacity-100">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div><label className="label">Title (optional)</label><input name="title" className="input" placeholder="e.g. Anti-Magic Unleashed" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Character Name *</label><input name="character" required className="input" placeholder="e.g. Asta" /></div>
          <div><label className="label">Anime Name *</label><input name="anime" required className="input" placeholder="e.g. Black Clover" /></div>
        </div>
        <div><label className="label">Tags</label><input name="tags" className="input" placeholder="comma,separated,tags" /></div>
        <div><label className="label">Description</label><textarea name="description" rows={3} className="input resize-none" placeholder="Short description…" /></div>
        <div><label className="label">Category</label>
          <select name="category" className="input">
            <option value="">None</option>
            <option>Male Characters</option>
            <option>Female Characters</option>
            <option>Wallpapers</option>
            <option>Action</option>
            <option>Aesthetic</option>
          </select>
        </div>
        <div><label className="label">Gender / Sex</label>
          <select name="gender" className="input">
            <option value="">Not specified</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
          </select>
        </div>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="featured" value="1" className="h-4 w-4 accent-white" /> Featured Artwork (shown in homepage hero)
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="published" value="1" defaultChecked className="h-4 w-4 accent-white" /> Publish immediately
        </label>
        {msg && <p className={`text-sm ${msg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
        <button disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy ? `Uploading ${Math.min(uploadedCount + 1, files.length)} of ${files.length}…` : `Publish${files.length > 1 ? ` ${files.length} artworks` : ""}`}
        </button>
      </div>
    </form>
  );
}
