'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MasonryGrid from '@/components/artwork/MasonryGrid';

export default function AnimePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [anime, setAnime] = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/anime?limit=100`)
      .then(r => r.json())
      .then(d => {
        const found = d.anime?.find((a: any) => a.slug === slug);
        setAnime(found);
        if (found) {
          fetch(`/api/characters?limit=200`)
            .then(r => r.json())
            .then(cd => {
              const chars = cd.characters?.filter((c: any) => c.anime_id === found.id) || [];
              setCharacters(chars);
              setLoading(false);
            });
        } else {
          setLoading(false);
        }
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808]">
        <Navbar />
        <div className="flex items-center justify-center pt-32"><div className="spinner" /></div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-[#080808]">
        <Navbar />
        <div className="text-center pt-32">
          <div className="text-6xl mb-4">🎬</div>
          <h1 className="text-2xl font-bold mb-2">Anime Not Found</h1>
          <Link href="/anime" className="text-[#D4AF37] hover:underline">Browse all anime →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-8">
        {/* Anime Header */}
        <div className="relative overflow-hidden" style={{ height: '320px' }}>
          <div className="absolute inset-0 bg-cover bg-center blur-xl scale-110 opacity-30" style={{ backgroundImage: `url(${anime.cover_url})` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#080808]" />
          <div className="relative z-10 h-full flex items-end max-w-[1800px] mx-auto px-4 pb-8">
            <div className="flex items-end gap-6">
              <div className="w-36 h-24 md:w-48 md:h-32 rounded-xl overflow-hidden border border-white/10 shadow-2xl shrink-0">
                <img src={anime.cover_url} alt={anime.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Link href="/" className="hover:text-white transition-colors">Home</Link>
                  <span>›</span>
                  <Link href="/anime" className="hover:text-white transition-colors">Anime</Link>
                  <span>›</span>
                  <span className="text-gray-400">{anime.name}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">{anime.name}</h1>
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  <span>{anime.artwork_count} artworks</span>
                  <span>{anime.character_count} characters</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Characters */}
        {characters.length > 0 && (
          <div className="max-w-[1800px] mx-auto px-4 py-8">
            <h2 className="text-xl font-bold mb-4">Characters</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {characters.map((char: any) => (
                <Link key={char.id} href={`/characters/${char.slug}`} className="shrink-0 group">
                  <div className="w-28 md:w-32">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden mb-2 bg-[#111]">
                      <img src={char.thumbnail_url} alt={char.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    </div>
                    <p className="text-xs font-medium truncate">{char.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Artworks */}
        <div className="max-w-[1800px] mx-auto px-4 py-8">
          <h2 className="text-xl font-bold mb-6">Artwork from {anime.name}</h2>
          <MasonryGrid anime={anime.id} limit={50} />
        </div>
      </main>
    </div>
  );
}
