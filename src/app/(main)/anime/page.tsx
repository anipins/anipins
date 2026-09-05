'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { proxyUrl } from '@/lib/utils';

export default function AnimePage() {
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [sort, setSort] = useState('popular');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('sort', sort);
    if (search) params.set('q', search);
    fetch(`/api/anime?${params}`)
      .then(r => r.json())
      .then(d => { setAnimeList(d.anime || []); setLoading(false); });
  }, [sort, search]);

  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-[1800px] mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Anime</h1>
          <p className="text-gray-500 mb-8">Collections by series.</p>

          <div className="flex flex-wrap gap-3 mb-8 items-center">
            <div className="relative flex-1 max-w-sm">
              <input type="text" placeholder="Search anime..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-[#181818] border border-white/10 text-sm focus:outline-none focus:border-[#D4AF37]/40" />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {['popular', 'az', 'za', 'newest'].map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={`px-4 py-2 rounded-full text-xs capitalize ${sort === s ? 'bg-[#D4AF37] text-black font-medium' : 'bg-[#181818] border border-white/10 hover:border-[#D4AF37]/30'}`}>
                {s === 'popular' ? 'Popular' : s === 'az' ? 'A-Z' : s === 'za' ? 'Z-A' : 'Newest'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><div className="spinner" /></div>
          ) : animeList.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {animeList.map((anime: any, i: number) => (
                <Link key={anime.id} href={`/anime/${anime.slug}`}
                  className="group animate-fadeInUp" style={{ animationDelay: `${Math.min(i * 30, 400)}ms` }}>
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-2 bg-[#111]">
                    <img src={proxyUrl(anime.cover_url)} alt={anime.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                  <p className="text-sm font-medium truncate">{anime.name}</p>
                  <p className="text-xs text-gray-500">{anime.artwork_count} artworks · {anime.character_count} characters</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🎬</div>
              <h3 className="text-lg font-semibold mb-2">No anime found</h3>
              <p className="text-gray-500">Try a different search term</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
