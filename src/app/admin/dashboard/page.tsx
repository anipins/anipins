'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { proxyUrl, formatNumber } from '@/lib/utils';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ artworks: 0, characters: 0, anime: 0, users: 1, views: 0, likes: 0 });
  const [recentArtworks, setRecentArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (!d.user || !['admin', 'super_admin'].includes(d.user.role)) {
        router.push('/');
        return;
      }
      setUser(d.user);
      loadData();
    });
  }, []);

  const loadData = async () => {
    try {
      const [artRes, charRes, animeRes] = await Promise.all([
        fetch('/api/artworks?limit=20&sort=latest').then(r => r.json()),
        fetch('/api/characters?limit=200').then(r => r.json()),
        fetch('/api/anime?limit=100').then(r => r.json()),
      ]);
      
      const artworks = artRes.artworks || [];
      setRecentArtworks(artworks);
      
      const totalViews = artworks.reduce((sum: number, a: any) => sum + (a.view_count || 0), 0);
      const totalLikes = artworks.reduce((sum: number, a: any) => sum + (a.like_count || 0), 0);

      setStats({
        artworks: artRes.pagination?.total || 0,
        characters: charRes.characters?.length || 0,
        anime: animeRes.anime?.length || 0,
        users: 1,
        views: totalViews,
        likes: totalLikes,
      });
    } catch (e) {
      console.error('Load error:', e);
    }
    setLoading(false);
  };

  const navItems = [
    { icon: '📊', label: 'Overview', active: true },
    { icon: '🖼️', label: 'Artwork', href: '/admin/artworks' },
    { icon: '📤', label: 'Upload', href: '/admin/upload' },
    { icon: '👤', label: 'Characters', href: '/admin/characters' },
    { icon: '🎬', label: 'Anime', href: '/admin/anime' },
    { icon: '👥', label: 'Users', href: '/admin/users' },
    { icon: '⚙️', label: 'Settings', href: '/admin/settings' },
  ];

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center">
          <img src="/brand/ap-symbol.svg" alt="AniPins" className="h-16 w-16 rounded-xl mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] flex" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#0C0C0C] border-r border-white/[0.05] flex flex-col h-screen sticky top-0 transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-white/[0.05]">
          <Link href="/" className="flex items-center gap-3">
            <img src="/brand/ap-symbol.svg" alt="" className="h-10 w-10 rounded-xl" />
            {sidebarOpen && (
              <div>
                <div className="font-bold text-base tracking-tight">
                  <span className="text-white">Ani</span>
                  <span className="text-[#D4AF37]">Pins</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full font-semibold tracking-wide">SUPER ADMIN</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => {
            const isActive = item.active;
            return (
              <Link
                key={item.label}
                href={item.href || '#'}
                onClick={(e) => { if (!item.href) e.preventDefault(); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                  isActive 
                    ? 'bg-[#D4AF37]/10 text-[#D4AF37] font-medium' 
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
              <span className="text-[#D4AF37] text-sm font-bold">{user.display_name?.[0]}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-300 truncate">{user.display_name}</div>
                <div className="text-xs text-gray-600 truncate">{user.email}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#080808]/90 backdrop-blur-xl border-b border-white/[0.05] px-8 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <p className="text-xs text-gray-500">Welcome back, {user.display_name}</p>
          </div>
          <Link href="/admin/upload" className="h-9 px-5 rounded-xl bg-[#D4AF37] text-black text-sm font-semibold hover:bg-[#C6A15B] transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Upload
          </Link>
        </header>

        <div className="p-8 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111] rounded-2xl border border-white/[0.05] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">Total Uploads</span>
                <span className="text-emerald-400 text-xs font-medium">↑ 20%</span>
              </div>
              <div className="text-3xl font-bold">{stats.artworks}</div>
              <div className="text-xs text-gray-500 mt-1">vs last month</div>
            </div>
            <div className="bg-[#111] rounded-2xl border border-white/[0.05] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">Characters</span>
                <span className="text-emerald-400 text-xs font-medium">↑ 12%</span>
              </div>
              <div className="text-3xl font-bold">{stats.characters}</div>
              <div className="text-xs text-gray-500 mt-1">unique characters</div>
            </div>
            <div className="bg-[#111] rounded-2xl border border-white/[0.05] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">Anime Series</span>
                <span className="text-emerald-400 text-xs font-medium">↑ 8%</span>
              </div>
              <div className="text-3xl font-bold">{stats.anime}</div>
              <div className="text-xs text-gray-500 mt-1">anime collections</div>
            </div>
            <div className="bg-[#111] rounded-2xl border border-white/[0.05] p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">Total Views</span>
                <span className="text-emerald-400 text-xs font-medium">↑ 35%</span>
              </div>
              <div className="text-3xl font-bold">{formatNumber(stats.views)}</div>
              <div className="text-xs text-gray-500 mt-1">all time views</div>
            </div>
          </div>

          {/* Upload New Artwork Section */}
          <div className="bg-[#111] rounded-2xl border border-white/[0.05] p-6">
            <h2 className="text-base font-semibold mb-4">Upload new artwork</h2>
            <Link href="/admin/upload">
              <div className="border-2 border-dashed border-white/[0.08] rounded-2xl p-12 text-center hover:border-[#D4AF37]/30 transition-colors cursor-pointer group">
                <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <p className="text-gray-400 text-sm mb-2">Drag & drop artwork files here</p>
                <p className="text-gray-600 text-xs">or click to browse files</p>
              </div>
            </Link>
          </div>

          {/* Recent Uploads */}
          <div className="bg-[#111] rounded-2xl border border-white/[0.05] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.05]">
              <div>
                <h2 className="font-semibold">Recent Uploads</h2>
                <p className="text-xs text-gray-500 mt-0.5">Latest artwork added to the collection</p>
              </div>
              <Link href="/admin/artworks" className="text-xs text-[#D4AF37] hover:text-[#C6A15B] transition-colors">
                View All →
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-5">
              {recentArtworks.slice(0, 10).map((art: any) => (
                <Link key={art.id} href={`/artwork/${art.id}`} className="group">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#0A0A0A] mb-2">
                    <img 
                      src={proxyUrl(art.thumbnail_url)} 
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <p className="text-xs font-medium truncate group-hover:text-[#D4AF37] transition-colors">{art.title}</p>
                  <p className="text-[10px] text-gray-500 truncate">{art.character_name}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/upload" className="bg-[#111] rounded-2xl border border-white/[0.05] p-5 hover:border-[#D4AF37]/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              </div>
              <h3 className="font-medium text-sm mb-1 group-hover:text-[#D4AF37] transition-colors">Upload New Artwork</h3>
              <p className="text-xs text-gray-500">Add anime artwork to the collection</p>
            </Link>

            <Link href="/admin/artworks" className="bg-[#111] rounded-2xl border border-white/[0.05] p-5 hover:border-purple-500/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="font-medium text-sm mb-1 group-hover:text-purple-400 transition-colors">Manage Artwork</h3>
              <p className="text-xs text-gray-500">Edit, feature, or remove artwork</p>
            </Link>

            <Link href="/" className="bg-[#111] rounded-2xl border border-white/[0.05] p-5 hover:border-blue-500/20 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
              </div>
              <h3 className="font-medium text-sm mb-1 group-hover:text-blue-400 transition-colors">View Website</h3>
              <p className="text-xs text-gray-500">Preview your live AniPins site</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
