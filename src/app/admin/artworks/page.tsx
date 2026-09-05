'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminArtworks() {
  const [user, setUser] = useState<any>(null);
  const [artworks, setArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || !['admin', 'super_admin'].includes(d.user.role)) {
        router.push('/');
        return;
      }
      setUser(d.user);
      loadArtworks();
    });
  }, []);

  const loadArtworks = async () => {
    const res = await fetch('/api/artworks?limit=100&sort=latest');
    const data = await res.json();
    setArtworks(data.artworks || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this artwork?')) return;
    // In production, this would call a DELETE API
    setArtworks(prev => prev.filter(a => a.id !== id));
  };

  const filteredArtworks = search
    ? artworks.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || a.character_name?.toLowerCase().includes(search.toLowerCase()))
    : artworks;

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] flex">
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
            { label: 'Upload Artwork', icon: '📤', href: '/admin/upload' },
            { label: 'Manage Artwork', icon: '🖼️', href: '/admin/artworks', active: true },
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

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Manage Artwork</h1>
              <p className="text-sm text-gray-500">{artworks.length} total artworks</p>
            </div>
            <Link href="/admin/upload"
              className="px-5 py-2.5 rounded-lg bg-[#D4AF37] text-black font-semibold hover:bg-[#C6A15B] transition-colors text-sm">
              + Upload New
            </Link>
          </div>

          <div className="mb-6">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search artworks..."
              className="w-full max-w-md h-10 px-4 rounded-lg bg-[#111] border border-white/10 text-sm focus:outline-none focus:border-[#D4AF37]/40" />
          </div>

          <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Artwork</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Character</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Anime</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Views</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Likes</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArtworks.map(art => (
                    <tr key={art.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={art.thumbnail_url} alt={art.title} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <p className="text-sm font-medium truncate max-w-[200px]">{art.title}</p>
                            <p className="text-xs text-gray-500">{art.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-400">{art.character_name || '—'}</td>
                      <td className="p-4 text-sm text-gray-400">{art.anime_name || '—'}</td>
                      <td className="p-4 text-sm text-gray-400">{art.view_count || 0}</td>
                      <td className="p-4 text-sm text-gray-400">{art.like_count || 0}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${art.is_published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {art.is_published ? 'Published' : 'Draft'}
                        </span>
                        {art.is_featured ? <span className="ml-1 px-2 py-1 rounded-full text-xs bg-[#D4AF37]/20 text-[#D4AF37]">Featured</span> : null}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/artwork/${art.id}`}
                            className="px-3 py-1.5 rounded text-xs bg-white/5 hover:bg-white/10 transition-colors">View</Link>
                          <button onClick={() => handleDelete(art.id)}
                            className="px-3 py-1.5 rounded text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredArtworks.length === 0 && (
              <div className="p-8 text-center text-gray-500">No artworks found</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
