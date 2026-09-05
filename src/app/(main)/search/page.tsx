'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MasonryGrid from '@/components/artwork/MasonryGrid';
import { proxyUrl } from '@/lib/utils';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ characters: [], anime: [], artworks: [] });
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(query)}`)
          .then(r => r.json())
          .then(d => { setResults(d); setShowResults(true); });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setShowResults(false);
    }
  }, [query]);

  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-[1800px] mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Search</h1>

          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input type="text" value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-4 rounded-2xl bg-[#181818] border border-white/10 text-lg focus:outline-none focus:border-[#D4AF37]/40 transition-colors"
                placeholder="Search characters, anime, wallpapers, art..." autoFocus />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {showResults && (
            <div className="space-y-8">
              {results.characters.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Characters</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {results.characters.map((c: any) => (
                      <Link key={c.id} href={`/characters/${c.slug}`} className="group">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#111] mb-2">
                          <img src={proxyUrl(c.thumbnail_url)} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.anime_name}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.anime.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Anime</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {results.anime.map((a: any) => (
                      <Link key={a.id} href={`/anime/${a.slug}`} className="group">
                        <div className="aspect-video rounded-xl overflow-hidden bg-[#111] mb-2">
                          <img src={proxyUrl(a.cover_url)} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <p className="text-sm font-medium truncate">{a.name}</p>
                        <p className="text-xs text-gray-500">{a.artwork_count} artworks</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {results.artworks.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Artwork</h2>
                  <MasonryGrid search={query} limit={30} />
                </div>
              )}

              {results.characters.length === 0 && results.anime.length === 0 && results.artworks.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold mb-2">No results for "{query}"</h3>
                  <p className="text-gray-500">Try a different search term</p>
                </div>
              )}
            </div>
          )}

          {!showResults && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">✨</div>
              <h3 className="text-lg font-semibold mb-2">Discover Anime Art</h3>
              <p className="text-gray-500">Search for characters, anime, or artwork</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
