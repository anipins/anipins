"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toaster";

type UploadItem = {
  key: string; file: File; preview: string; title: string; character: string; anime: string;
  tags: string; description: string; creator: string; sourceUrl: string; category: string;
  gender: string; featured: boolean; premium: boolean; published: boolean;
};

const blank = (file: File, index: number, premiumOnly: boolean): UploadItem => ({
  key: `${file.name}-${file.size}-${file.lastModified}-${index}`, file, preview: URL.createObjectURL(file),
  title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "), character: "", anime: "", tags: "",
  description: "", creator: "", sourceUrl: "", category: "", gender: "", featured: false, premium: premiumOnly, published: true,
});

const retryableStatus = (status: number) => [408, 425, 429, 500, 502, 503, 504].includes(status);
// Keep enough transfers in flight to use a normal broadband connection without
// overwhelming image processing, storage, or the browser with a huge batch.
const PARALLEL_UPLOADS = 3;

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
}

export default function AdminUpload({ premiumOnly = false }: { premiumOnly?: boolean }) {
  const [items, setItems] = useState<UploadItem[]>([]), [drag, setDrag] = useState(false), [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(""), [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null); const router = useRouter();

  const addFiles = (list: FileList | File[]) => {
    const images = Array.from(list).filter(file => file.type.startsWith("image/"));
    setItems(previous => [...previous, ...images.map((file, index) => blank(file, previous.length + index, premiumOnly))]);
  };
  const update = (key: string, values: Partial<UploadItem>) => setItems(previous => previous.map(item => item.key === key ? { ...item, ...values } : item));
  const remove = (key: string) => setItems(previous => { const item = previous.find(value => value.key === key); if (item) URL.revokeObjectURL(item.preview); return previous.filter(value => value.key !== key); });
  const applyFirstToAll = () => setItems(previous => previous.length < 2 ? previous : previous.map((item, index) => index === 0 ? item : ({ ...item, character: previous[0].character, anime: previous[0].anime, tags: previous[0].tags, description: previous[0].description, creator: previous[0].creator, sourceUrl: previous[0].sourceUrl, category: previous[0].category, gender: previous[0].gender, featured: previous[0].featured, premium: previous[0].premium, published: previous[0].published })));

  const send = async (item: UploadItem, allowDuplicate = false) => {
    const data = new FormData(); data.append("files", item.file); data.append("title", item.title); data.append("character", item.character); data.append("anime", item.anime);
    data.append("tags", item.tags); data.append("description", item.description); data.append("creator", item.creator); data.append("sourceUrl", item.sourceUrl); data.append("category", item.category); data.append("gender", item.gender);
    if (item.featured) data.append("featured", "1"); if (item.premium) data.append("premium", "1"); if (item.published) data.append("published", "1"); if (allowDuplicate) data.append("allowDuplicate", "1");
    const payload = { title: item.title, character: item.character, anime: item.anime, tags: item.tags, description: item.description, creator: item.creator, sourceUrl: item.sourceUrl, category: item.category, gender: item.gender, featured: item.featured, premium: item.premium, published: item.published, allowDuplicate, fileName: item.file.name, fileType: item.file.type, fileSize: item.file.size };
    let signed: { direct?: boolean; uploadUrl?: string; key?: string } | null = null;
    let stored = false;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        // The file itself now goes directly to a one-time protected storage URL.
        // That avoids Vercel's request body ceiling which returned HTTP 413 for
        // high-resolution PNGs. The final app request is only small JSON.
        if (!signed) {
          const signedResponse = await fetchWithTimeout("/api/admin/upload/sign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: item.file.name, type: item.file.type, size: item.file.size }) }, 30_000);
          const prepared = await signedResponse.json().catch(() => ({ error: `Upload preparation failed (${signedResponse.status})` }));
          if (!signedResponse.ok) {
            if (!retryableStatus(signedResponse.status)) return { response: signedResponse, result: prepared };
            throw new Error(prepared.error || `Upload preparation failed (${signedResponse.status})`);
          }
          signed = prepared;
        }
        let response: Response;
        if (signed.direct) {
          setProgress(`Sending ${item.file.name} directly to secure artwork storage…`);
          if (!stored) {
            const storageResponse = await fetchWithTimeout(signed.uploadUrl!, { method: "PUT", headers: { "Content-Type": item.file.type, "Cache-Control": "public, max-age=31536000, immutable", "x-upsert": "false" }, body: item.file }, 10 * 60_000);
            if (!storageResponse.ok) {
              if (!retryableStatus(storageResponse.status)) return { response: storageResponse, result: { error: `Artwork storage upload failed (${storageResponse.status}). Please retry this image.` } };
              signed = null;
              throw new Error(`Artwork storage upload failed (${storageResponse.status})`);
            }
            stored = true;
          }
          setProgress(`Processing ${item.file.name}…`);
          response = await fetchWithTimeout("/api/admin/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, storageKey: signed.key }) }, 5 * 60_000);
        } else {
          // Local development fallback when no object storage is configured.
          response = await fetchWithTimeout("/api/admin/upload", { method: "POST", body: data }, 5 * 60_000);
        }
        const result = await response.json().catch(() => ({ error: `Upload failed (${response.status})` }));
        if (response.ok || response.status === 409 || !retryableStatus(response.status) || attempt === 4) return { response, result };
        const retryAfter = Number(response.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt;
        setProgress(`Server busy; retrying ${item.file.name} (${attempt + 2} of 5)…`);
        await new Promise(resolve => setTimeout(resolve, Math.min(delay, 15_000)));
      } catch (error) {
        if (attempt === 4) {
          const timedOut = error instanceof DOMException && error.name === "AbortError";
          throw new Error(timedOut ? `Upload timed out while ${stored ? "processing" : "sending"} this image. Please retry this image.` : `Connection interrupted while ${stored ? "processing" : "sending"} this image. Please retry this image.`);
        }
        setProgress(`Connection interrupted; retrying ${item.file.name} (${attempt + 2} of 5)…`);
        await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
      }
    }
    throw new Error("Upload failed after retries");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!items.length) { setMessage("Add at least one image."); return; }
    if (!premiumOnly && items.some(item => !item.character.trim() || !item.anime.trim())) { setMessage("Every public image needs its own character and anime name."); return; }
    setBusy(true); setMessage(""); const uploaded = new Set<string>(); const failures: string[] = [];
    let nextIndex = 0;
    let completeCount = 0;
    const processItem = async (item: UploadItem, index: number) => {
      setProgress(`Uploading ${index + 1} of ${items.length}: ${item.file.name}`);
      try {
        let { response, result } = await send(item);
        if (response.status === 409 && result.canOverride) {
          const match = result.duplicates?.[0]?.artwork; const detail = match ? `It resembles #${match.id}, ${match.character_name} from ${match.anime_name}.` : "It resembles another uploaded image.";
          if (confirm(`Possible duplicate: ${item.file.name}\n\n${detail}\n\nUpload it anyway?`)) ({ response, result } = await send(item, true));
        }
        if (!response.ok) throw new Error(result.error || "Upload failed");
        uploaded.add(item.key); URL.revokeObjectURL(item.preview);
      } catch (error) { failures.push(`${item.file.name}: ${error instanceof Error ? error.message : "Upload failed"}`); }
      finally {
        completeCount += 1;
        setProgress(`Finished ${completeCount} of ${items.length} artwork${items.length === 1 ? "" : "s"}…`);
      }
    };
    const worker = async () => {
      while (true) {
        const index = nextIndex++;
        if (index >= items.length) return;
        await processItem(items[index], index);
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLEL_UPLOADS, items.length) }, worker));
    setItems(previous => previous.filter(item => !uploaded.has(item.key))); setBusy(false); setProgress("");
    if (uploaded.size) { toast(`${uploaded.size} artwork${uploaded.size === 1 ? "" : "s"} published`); router.refresh(); }
    const failureSummary = failures.length > 6 ? `${failures.slice(0, 6).join(" · ")} · ${failures.length - 6} more image${failures.length - 6 === 1 ? "" : "s"} can be retried.` : failures.join(" · ");
    setMessage(failures.length ? `Published ${uploaded.size}. ${failureSummary}` : `✓ Published ${uploaded.size} artwork${uploaded.size === 1 ? "" : "s"}. Each kept its own metadata.`);
  };

  return (
    <form onSubmit={submit} className="space-y-7">
      <div><label className="label">{premiumOnly ? "Premium library upload" : "Public artwork upload"}</label><div onDragOver={event => { event.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={event => { event.preventDefault(); setDrag(false); addFiles(event.dataTransfer.files); }} onClick={() => inputRef.current?.click()} className={`grid min-h-44 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${drag ? "border-gold bg-gold/5" : "border-paper/15 hover:border-paper/30"}`}><div><p className="text-sm">Drag and drop all images here, or click to browse</p><p className="mt-1 text-xs text-fog">JPG, PNG or WebP · up to 40 MB each · large batches of 1,000+ are queued safely · keep this page open until complete</p></div><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={event => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} /></div>{premiumOnly ? <p className="mt-3 rounded-xl border border-gold/25 bg-gold/5 px-4 py-3 text-sm text-gold">Premium-only destination: these uploads bypass every public feed and are available only to active Premium members and admins.</p> : <p className="mt-3 text-xs text-fog">Public uploads appear in the normal AniPins feeds. Use the separate Premium upload area for member-only artwork.</p>}</div>
      {items.length > 1 ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-soft p-4 hairline"><p className="text-sm text-fog">Uploading one character or series? Fill the first card, then copy its shared details.</p><button type="button" onClick={applyFirstToAll} className="btn-ghost !px-4 !py-2">Apply first card details to all</button></div> : null}
      <div className="space-y-5">{items.map((item, index) => <article key={item.key} style={{ contentVisibility: "auto", containIntrinsicSize: "280px" }} className="grid gap-5 rounded-3xl bg-panel p-5 hairline md:grid-cols-[180px,1fr]">
        <div><img src={item.preview} alt={`Preview ${index + 1}`} className="aspect-square w-full rounded-2xl object-cover" /><p className="mt-2 truncate text-xs text-fog">{item.file.name}</p><button type="button" onClick={() => remove(item.key)} className="mt-2 text-xs text-red-300 hover:underline">Remove</button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><p className="text-xs font-medium text-gold">Artwork {index + 1} of {items.length}</p></div>
          <Field label="Title" value={item.title} onChange={title => update(item.key, { title })} />
           <Field label={premiumOnly ? "Character name (optional)" : "Character name *"} value={item.character} onChange={character => update(item.key, { character })} required={!premiumOnly} />
           <Field label={premiumOnly ? "Anime / series (optional)" : "Anime / manhua series *"} value={item.anime} onChange={anime => update(item.key, { anime })} required={!premiumOnly} />
          <Field label="Tags" value={item.tags} onChange={tags => update(item.key, { tags })} placeholder="portrait, action, wallpaper" />
          <div><label className="label">Gender / sex</label><select className="input" value={item.gender} onChange={event => update(item.key, { gender: event.target.value })}><option value="">Not specified</option><option>Male</option><option>Female</option><option>Non-binary</option></select></div>
          <div><label className="label">Category</label><select className="input" value={item.category} onChange={event => update(item.key, { category: event.target.value })}><option value="">None</option><option>Male Characters</option><option>Female Characters</option><option>Wallpapers</option><option>Action</option><option>Aesthetic</option></select><p className="mt-1 text-xs text-fog">Choose Wallpapers to include this image in the dedicated wallpaper feed.</p></div>
          <Field label="Creator / artist" value={item.creator} onChange={creator => update(item.key, { creator })} />
          <Field label="Original source URL" value={item.sourceUrl} onChange={sourceUrl => update(item.key, { sourceUrl })} type="url" />
          <div className="sm:col-span-2"><label className="label">Description</label><textarea rows={2} className="input resize-none" value={item.description} onChange={event => update(item.key, { description: event.target.value })} /></div>
           <div className="flex flex-wrap gap-5 text-sm sm:col-span-2">{premiumOnly ? <span className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3 py-1.5 text-gold">Premium exclusive <span className="text-xs text-fog">locked to member library</span></span> : <label className="flex items-center gap-2"><input type="checkbox" checked={item.featured} onChange={event => update(item.key, { featured: event.target.checked })} className="accent-gold" /> Featured</label>}<label className="flex items-center gap-2"><input type="checkbox" checked={item.published} onChange={event => update(item.key, { published: event.target.checked })} className="accent-gold" /> Publish immediately</label></div>
        </div>
      </article>)}</div>
      {progress ? <div className="rounded-2xl bg-soft p-4 hairline" aria-live="polite"><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="truncate text-gold">{progress}</span><span className="shrink-0 text-fog">Please keep this page open</span></div><div className="h-1.5 overflow-hidden rounded-full bg-ink"><div className="h-full animate-pulse rounded-full bg-gold" style={{ width: `${Math.max(8, ((Number(progress.match(/Uploading (\d+)/)?.[1]) || 1) / Math.max(items.length, 1)) * 100)}%` }} /></div></div> : null}{message ? <p className={`text-sm ${message.startsWith("✓") ? "text-green-400" : "text-red-300"}`}>{message}</p> : null}
      <button disabled={busy || !items.length} className="btn-primary w-full disabled:opacity-50">{busy ? "Uploading…" : `Publish ${items.length || ""} artwork${items.length === 1 ? "" : "s"}`}</button>
    </form>
  );
}

function Field({ label, value, onChange, required = false, placeholder = "", type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; type?: string }) {
  return <div><label className="label">{label}</label><input type={type} required={required} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="input" /></div>;
}
