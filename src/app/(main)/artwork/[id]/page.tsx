'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';

export default function ArtworkPage() {
  const params = useParams();
  const id = params.id as string;
  const [artwork, setArtwork] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAniFit, setShowAniFit] = useState(false);
  const [device, setDevice] = useState('iphone');

  useEffect(() => {
    fetch(`/api/artworks?limit=30`)
      .then(r => r.json())
      .then(d => {
        const found = d.artworks?.find((a: any) => a.id === id);
        setArtwork(found);
        if (found) {
          const rel = d.artworks?.filter((a: any) => a.id !== id && (a.anime_id === found.anime_id || a.character_id === found.character_id)).slice(0, 12);
          setRelated(rel || []);
        }
        setLoading(false);
      });
    fetch('/api/likes').then(r => r.json()).then(d => setLiked(d.likes?.includes(id)));
    fetch('/api/saves').then(r => r.json()).then(d => setSaved(d.saves?.includes(id)));
  }, [id]);

  const handleLike = async () => {
    const res = await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ artworkId: id }) });
    const data = await res.json();
    setLiked(data.liked);
  };

  const handleSave = async () => {
    const res = await fetch('/api/saves', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ artworkId: id }) });
    const data = await res.json();
    setSaved(data.saved);
  };

  const handleDownload = async () => {
    if (!artwork) return;
    try {
      const res = await fetch(artwork.image_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${artwork.title.replace(/[^a-z0-9]/gi, '_')}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(artwork.image_url, '_blank');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: artwork?.title, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808]">
        <Navbar />
        <div className="flex items-center justify-center pt-32"><div className="spinner" /></div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen bg-[#080808]">
        <Navbar />
        <div className="text-center pt-32">
          <div className="text-6xl mb-4">🎨</div>
          <h1 className="text-2xl font-bold mb-2">Artwork Not Found</h1>
          <Link href="/explore" className="text-[#D4AF37] hover:underline">Browse all artwork →</Link>
        </div>
      </div>
    );
  }

  const devices = [
    { id: 'iphone', label: 'iPhone', w: 390, h: 844 },
    { id: 'android', label: 'Android', w: 412, h: 915 },
    { id: 'tablet', label: 'Tablet', w: 820, h: 1180 },
    { id: 'desktop', label: 'Desktop', w: 1920, h: 1080 },
  ];

  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-[1800px] mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>›</span>
            <Link href="/explore" className="hover:text-white">Explore</Link>
            <span>›</span>
            <span className="text-gray-400">{artwork.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Image */}
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl overflow-hidden bg-[#111]">
                <img src={artwork.image_url} alt={artwork.title} className="w-full block" />
                
                {/* AniFit overlay */}
                {showAniFit && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-8">
                    <div className="relative w-full max-w-sm">
                      <div className="relative mx-auto overflow-hidden rounded-3xl border-2 border-white/20"
                        style={{ width: `${Math.min(devices.find(d => d.id === device)?.w || 390, 350)}px`, height: `${Math.min((devices.find(d => d.id === device)?.h || 844) * 0.7, 600)}px` }}>
                        <img src={artwork.image_url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-0 right-0 text-center">
                          <p className="text-white/60 text-xs">9:41</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 justify-center">
                        {devices.map(d => (
                          <button key={d.id} onClick={() => setDevice(d.id)}
                            className={`px-3 py-1.5 rounded-full text-xs ${device === d.id ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-white'}`}>
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions bar */}
              <div className="flex flex-wrap gap-3 mt-4">
                <button onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${liked ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-[#181818] border border-white/10 hover:border-[#D4AF37]/30'}`}>
                  <svg className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  {liked ? 'Liked' : 'Like'}
                </button>
                <button onClick={handleSave}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${saved ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30' : 'bg-[#181818] border border-white/10 hover:border-[#D4AF37]/30'}`}>
                  <svg className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  {saved ? 'Saved' : 'Save'}
                </button>
                <button onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-[#181818] border border-white/10 hover:border-[#D4AF37]/30 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download
                </button>
                <button onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-[#181818] border border-white/10 hover:border-[#D4AF37]/30 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                  Share
                </button>
                <button onClick={() => setShowAniFit(!showAniFit)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-[#181818] border border-white/10 hover:border-[#D4AF37]/30 transition-all">
                  📱 AniFit
                </button>
              </div>
            </div>

            {/* Info Panel */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">{artwork.title}</h1>
                {artwork.character_name && (
                  <Link href={`/characters/${artwork.character_slug}`}
                    className="text-[#D4AF37] hover:underline text-lg">{artwork.character_name}</Link>
                )}
                {artwork.anime_name && (
                  <Link href={`/anime/${artwork.anime_slug}`}
                    className="block text-gray-400 hover:text-white transition-colors">{artwork.anime_name}</Link>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#111] rounded-xl p-4 border border-white/5">
                  <div className="text-2xl font-bold">{artwork.view_count || 0}</div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
                <div className="bg-[#111] rounded-xl p-4 border border-white/5">
                  <div className="text-2xl font-bold">{artwork.like_count || 0}</div>
                  <div className="text-xs text-gray-500">Likes</div>
                </div>
                <div className="bg-[#111] rounded-xl p-4 border border-white/5">
                  <div className="text-2xl font-bold">{artwork.save_count || 0}</div>
                  <div className="text-xs text-gray-500">Saves</div>
                </div>
                <div className="bg-[#111] rounded-xl p-4 border border-white/5">
                  <div className="text-2xl font-bold">{artwork.download_count || 0}</div>
                  <div className="text-xs text-gray-500">Downloads</div>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-[#111] rounded-xl p-4 border border-white/5 space-y-3">
                <h3 className="text-sm font-semibold text-[#D4AF37]">Details</h3>
                {[
                  ['Type', artwork.artwork_type],
                  ['Orientation', artwork.orientation],
                  ['Category', artwork.category],
                  ['Resolution', artwork.resolution],
                ].map(([label, value]) => value ? (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span>{value}</span>
                  </div>
                ) : null)}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button onClick={handleDownload}
                  className="w-full h-12 rounded-xl bg-[#D4AF37] text-black font-semibold hover:bg-[#C6A15B] transition-colors">
                  Download Original
                </button>
                <button onClick={() => setShowAniFit(!showAniFit)}
                  className="w-full h-12 rounded-xl bg-[#181818] border border-white/10 font-medium hover:border-[#D4AF37]/30 transition-colors">
                  AniFit™ Preview
                </button>
              </div>
            </div>
          </div>

          {/* Related Artwork */}
          {related.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold mb-6">More Like This</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {related.map((art: any) => (
                  <Link key={art.id} href={`/artwork/${art.id}`} className="group">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#111]">
                      <img src={art.thumbnail_url} alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>
                    <p className="text-xs mt-1 truncate">{art.character_name}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
