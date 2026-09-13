"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toaster";

type UploadItem = {
  key: string; file: File; preview: string; title: string; character: string; anime: string;
  tags: string; description: string; creator: string; sourceUrl: string; category: string;
  gender: string; featured: boolean; published: boolean;
};

const blank = (file: File, index: number): UploadItem => ({
  key: `${file.name}-${file.size}-${file.lastModified}-${index}`, file, preview: URL.createObjectURL(file),
  title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "), character: "", anime: "", tags: "",
  description: "", creator: "", sourceUrl: "", category: "", gender: "", featured: false, published: true,
});

export default function AdminUpload() {
  const [items, setItems] = useState<UploadItem[]>([]), [drag, setDrag] = useState(false), [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(""), [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null); const router = useRouter();

  const addFiles = (list: FileList | File[]) => {
    const images = Array.from(list).filter(file => file.type.startsWith("image/"));
    setItems(previous => [...previous, ...images.map((file, index) => blank(file, previous.length + index))]);
  };
  const update = (key: string, values: Partial<UploadItem>) => setItems(previous => previous.map(item => item.key === key ? { ...item, ...values } : item));
  const remove = (key: string) => setItems(previous => { const item = previous.find(value => value.key === key); if (item) URL.revokeObjectURL(item.preview); return previous.filter(value => value.key !== key); });
  const applyFirstToAll = () => setItems(previous => previous.length < 2 ? previous : previous.map((item, index) => index === 0 ? item : ({ ...item, character: previous[0].character, anime: previous[0].anime, tags: previous[0].tags, description: previous[0].description, creator: previous[0].creator, sourceUrl: previous[0].sourceUrl, category: previous[0].category, gender: previous[0].gender, featured: previous[0].featured, published: previous[0].published })));

  const send = async (item: UploadItem, allowDuplicate = false) => {
    const data = new FormData(); data.append("files", item.file); data.append("title", item.title); data.append("character", item.character); data.append("anime", item.anime);
    data.append("tags", item.tags); data.append("description", item.description); data.append("creator", item.creator); data.append("sourceUrl", item.sourceUrl); data.append("category", item.category); data.append("gender", item.gender);
    if (item.featured) data.append("featured", "1"); if (item.published) data.append("published", "1"); if (allowDuplicate) data.append("allowDuplicate", "1");
    const response = await fetch("/api/admin/upload", { method: "POST", body: data }); const result = await response.json(); return { response, result };
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (!items.length) { setMessage("Add at least one image."); return; }
    if (items.some(item => !item.character.trim() || !item.anime.trim())) { setMessage("Every image needs its own character and anime name."); return; }
    setBusy(true); setMessage(""); const uploaded = new Set<string>(); const failures: string[] = [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index]; setProgress(`Uploading ${index + 1} of ${items.length}: ${item.file.name}`);
      try {
        let { response, result } = await send(item);
        if (response.status === 409 && result.canOverride) {
          const match = result.duplicates?.[0]?.artwork; const detail = match ? `It resembles #${match.id}, ${match.character_name} from ${match.anime_name}.` : "It resembles another uploaded image.";
          if (confirm(`Possible duplicate: ${item.file.name}\n\n${detail}\n\nUpload it anyway?`)) ({ response, result } = await send(item, true));
        }
        if (!response.ok) throw new Error(result.error || "Upload failed");
        uploaded.add(item.key); URL.revokeObjectURL(item.preview);
      } catch (error) { failures.push(`${item.file.name}: ${error instanceof Error ? error.message : "Upload failed"}`); }
    }
    setItems(previous => previous.filter(item => !uploaded.has(item.key))); setBusy(false); setProgress("");
    if (uploaded.size) { toast(`${uploaded.size} artwork${uploaded.size === 1 ? "" : "s"} published`); router.refresh(); }
    setMessage(failures.length ? `Published ${uploaded.size}. ${failures.join(" · ")}` : `✓ Published ${uploaded.size} artwork${uploaded.size === 1 ? "" : "s"}. Each kept its own metadata.`);
  };

  return (
    <form onSubmit={submit} className="space-y-7">
      <div><label className="label">Artwork upload</label><div onDragOver={event => { event.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={event => { event.preventDefault(); setDrag(false); addFiles(event.dataTransfer.files); }} onClick={() => inputRef.current?.click()} className={`grid min-h-44 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${drag ? "border-gold bg-gold/5" : "border-paper/15 hover:border-paper/30"}`}><div><p className="text-sm">Drag and drop all images here, or click to browse</p><p className="mt-1 text-xs text-fog">JPG, PNG or WebP · every selected image gets its own details form</p></div><input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={event => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} /></div></div>
      {items.length > 1 ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-soft p-4 hairline"><p className="text-sm text-fog">Uploading one character or series? Fill the first card, then copy its shared details.</p><button type="button" onClick={applyFirstToAll} className="btn-ghost !px-4 !py-2">Apply first card details to all</button></div> : null}
      <div className="space-y-5">{items.map((item, index) => <article key={item.key} className="grid gap-5 rounded-3xl bg-panel p-5 hairline md:grid-cols-[180px,1fr]">
        <div><img src={item.preview} alt={`Preview ${index + 1}`} className="aspect-square w-full rounded-2xl object-cover" /><p className="mt-2 truncate text-xs text-fog">{item.file.name}</p><button type="button" onClick={() => remove(item.key)} className="mt-2 text-xs text-red-300 hover:underline">Remove</button></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><p className="text-xs font-medium text-gold">Artwork {index + 1} of {items.length}</p></div>
          <Field label="Title" value={item.title} onChange={title => update(item.key, { title })} />
          <Field label="Character name *" value={item.character} onChange={character => update(item.key, { character })} required />
          <Field label="Anime / manhua series *" value={item.anime} onChange={anime => update(item.key, { anime })} required />
          <Field label="Tags" value={item.tags} onChange={tags => update(item.key, { tags })} placeholder="portrait, action, wallpaper" />
          <div><label className="label">Gender / sex</label><select className="input" value={item.gender} onChange={event => update(item.key, { gender: event.target.value })}><option value="">Not specified</option><option>Male</option><option>Female</option><option>Non-binary</option></select></div>
          <div><label className="label">Category</label><select className="input" value={item.category} onChange={event => update(item.key, { category: event.target.value })}><option value="">None</option><option>Male Characters</option><option>Female Characters</option><option>Wallpapers</option><option>Action</option><option>Aesthetic</option></select></div>
          <Field label="Creator / artist" value={item.creator} onChange={creator => update(item.key, { creator })} />
          <Field label="Original source URL" value={item.sourceUrl} onChange={sourceUrl => update(item.key, { sourceUrl })} type="url" />
          <div className="sm:col-span-2"><label className="label">Description</label><textarea rows={2} className="input resize-none" value={item.description} onChange={event => update(item.key, { description: event.target.value })} /></div>
          <div className="flex flex-wrap gap-5 text-sm sm:col-span-2"><label className="flex items-center gap-2"><input type="checkbox" checked={item.featured} onChange={event => update(item.key, { featured: event.target.checked })} className="accent-gold" /> Featured</label><label className="flex items-center gap-2"><input type="checkbox" checked={item.published} onChange={event => update(item.key, { published: event.target.checked })} className="accent-gold" /> Publish immediately</label></div>
        </div>
      </article>)}</div>
      {progress ? <p className="text-sm text-gold" aria-live="polite">{progress}</p> : null}{message ? <p className={`text-sm ${message.startsWith("✓") ? "text-green-400" : "text-red-300"}`}>{message}</p> : null}
      <button disabled={busy || !items.length} className="btn-primary w-full disabled:opacity-50">{busy ? "Uploading…" : `Publish ${items.length || ""} artwork${items.length === 1 ? "" : "s"}`}</button>
    </form>
  );
}

function Field({ label, value, onChange, required = false, placeholder = "", type = "text" }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; type?: string }) {
  return <div><label className="label">{label}</label><input type={type} required={required} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="input" /></div>;
}
