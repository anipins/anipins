'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminUpload() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [charList, setCharList] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    thumbnailUrl: '',
    animeId: '',
    characterId: '',
    category: 'Female Characters',
    orientation: 'portrait',
    artworkType: 'illustration',
    tags: '',
    isFeatured: false,
    isPublished: true,
  });
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || !['admin', 'super_admin'].includes(d.user.role)) {
        router.push('/');
        return;
      }
      setUser(d.user);
      loadFormData();
    });
  }, []);

  const loadFormData = async () => {
    const [animeRes, charRes] = await Promise.all([
      fetch('/api/anime?limit=100').then(r => r.json()),
      fetch('/api/characters?limit=200').then(r => r.json()),
    ]);
    setAnimeList(animeRes.anime || []);
    setCharList(charRes.characters || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // For now, we'll store the image URL directly
      // In production, this would upload to Supabase Storage
      const res = await fetch('/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(`Artwork "${form.title}" published successfully!`);
        setForm({
          title: '', description: '', imageUrl: '', thumbnailUrl: '',
          animeId: '', characterId: '', category: 'Female Characters',
          orientation: 'portrait', artworkType: 'illustration',
          tags: '', isFeatured: false, isPublished: true,
        });
      }
    } catch {
      setError('Upload failed');
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0D0D0D] border-r border-white/5 flex flex-col shrink-0 h-screen sticky top-0">
        <div className="p-4 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/brand/ap-symbol.svg" alt="" className="h-9 w-9 rounded-[10px] transition-shadow duration-300 group-hover:shadow-[0_0_18px_rgba(198,161,91,0.35)]" />
            <div>
              <div className="font-bold text-sm tracking-tight"><span className="text-white">Ani</span><span className="text-[#D4AF37]">Pins</span></div>
              <span className="text-[10px] px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full border border-[#D4AF37]/30 font-bold">SUPER ADMIN</span>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { label: 'Overview', icon: '📊', href: '/admin/dashboard' },
            { label: 'Upload Artwork', icon: '📤', href: '/admin/upload', active: true },
            { label: 'Manage Artwork', icon: '🖼️', href: '/admin/artworks' },
            { label: 'Characters', icon: '👤', href: '/admin/characters' },
            { label: 'Anime', icon: '🎬', href: '/admin/anime' },
            { label: 'Users', icon: '👥', href: '/admin/users' },
            { label: 'Settings', icon: '⚙️', href: '/admin/settings' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${item.active ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <Link href="/" className="text-xs text-[#D4AF37] hover:underline">← Back to site</Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-3xl">
          <h1 className="text-2xl font-bold mb-2">Upload Artwork</h1>
          <p className="text-gray-500 text-sm mb-8">Add new anime artwork to AniPins</p>

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{success}</div>
          )}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium mb-2">Image URL *</label>
              <input type="url" required value={form.imageUrl}
                onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg bg-[#111] border border-white/10 text-sm focus:outline-none focus:border-[#D4AF37]/40"
                placeholder="https://example.com/image.jpg" />
              {form.imageUrl && (
                <div className="mt-3 w-40 rounded-lg overflow-hidden border border-white/10">
                  <img src={form.imageUrl} alt="Preview" className="w-full" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className="block text-sm font-medium mb-2">Thumbnail URL</label>
              <input type="url" value={form.thumbnailUrl}
                onChange={e => setForm(p => ({ ...p, thumbnailUrl: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg bg-[#111] border border-white/10 text-sm focus:outline-none focus:border-[#D4AF37]/40"
                placeholder="https://example.com/thumb.jpg (optional)" />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input type="text" required value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg bg-[#111] border border-white/10 text-sm focus:outline-none focus:border-[#D4AF37]/40"
                placeholder="Artwork title" />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full h-24 px-4 py-3 rounded-lg bg-[#111] border border-white/10 text-sm focus:outline-none focus:border-[#D4AF37]/40 resize-none"
                placeholder="Optional description" />
            </div>

            {/* Anime & Character */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Anime</label>
                <select value={form.animeId}
                  onChange={e => setForm(p => ({ ...p, animeId: e.target.value }))}
                  className="w-full h-11 px-4 rounded-lg bg-[#111] border border-white/10 text-sm focus:outline-none focus:border-[#D4AF37]/40">
                  <option value="">Select anime...</option>
                  {animeList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Character</label>
                <select value={form.characterId}
                  onChange={e => setForm(p => ({ ...p, characterId: e.target.value }))}
                  className="w-full h-11 px-4 rounded-lg bg-[#111] border border-white/10 text-sm focus:outline-none focus:border-[#D4AF37]/40">
                  <option value="">Select character...</option>
                  {charList.map(c => <option key={c.id} value={c.id}>{c.name} ({c.anime_name})</option>)}
                </select>
              </div>
            </div>

            {/* Category & Orientation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full h-11 px-4 rounded-lg bg-[#111] border border-white/10 text-sm focus:outline-none focus:border-[#D4AF37]/40">
                  <option>Female Characters</option>
                  <option>Male Characters</option>
                  <option>Wallpapers</option>
                  <option>Fan Art</option>
                  <option>Official Art</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Orientation</label>
                <select value={form.orientation}
                  onChange={e => setForm(p => ({ ...p, orientation: e.target.value }))}
                  className="w-full h-11 px-4 rounded-lg bg-[#111] border border-white/10 text-sm focus:outline-none focus:border-[#D4AF37]/40">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                  <option value="square">Square</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input type="text" value={form.tags}
                onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                className="w-full h-11 px-4 rounded-lg bg-[#111] border border-white/10 text-sm focus:outline-none focus:border-[#D4AF37]/40"
                placeholder="anime, cool, wallpaper (comma separated)" />
            </div>

            {/* Options */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured}
                  onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))}
                  className="rounded border-white/20 bg-[#111] text-[#D4AF37] focus:ring-[#D4AF37]" />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublished}
                  onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))}
                  className="rounded border-white/20 bg-[#111] text-[#D4AF37] focus:ring-[#D4AF37]" />
                <span className="text-sm">Published</span>
              </label>
            </div>

            <button type="submit" disabled={uploading}
              className="w-full h-12 rounded-xl bg-[#D4AF37] text-black font-semibold hover:bg-[#C6A15B] transition-colors disabled:opacity-50">
              {uploading ? 'Publishing...' : 'Publish Artwork'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
