'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MasonryGrid from '@/components/artwork/MasonryGrid';

export default function CharacterPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/characters?limit=200`)
      .then(r => r.json())
      .then(d => {
        const found = d.characters?.find((c: any) => c.slug === slug);
        setCharacter(found);
        setLoading(false);
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

  if (!character) {
    return (
      <div className="min-h-screen bg-[#080808]">
        <Navbar />
        <div className="text-center pt-32">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Character Not Found</h1>
          <Link href="/characters" className="text-[#D4AF37] hover:underline">Browse all characters →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-8">
        {/* Character Header */}
        <div className="relative overflow-hidden" style={{ height: '300px' }}>
          <div className="absolute inset-0 bg-cover bg-center blur-xl scale-110 opacity-30" style={{ backgroundImage: `url(${character.thumbnail_url})` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#080808]" />
          <div className="relative z-10 h-full flex items-end max-w-[1800px] mx-auto px-4 pb-8">
            <div className="flex items-end gap-6">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-[#D4AF37]/30 shadow-2xl shrink-0">
                <img src={character.thumbnail_url} alt={character.name} className="w-full h-full object-cover" />
              </div>
              <div>
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Link href="/" className="hover:text-white transition-colors">Home</Link>
                  <span>›</span>
                  <Link href="/characters" className="hover:text-white transition-colors">Characters</Link>
                  <span>›</span>
                  <span className="text-gray-400">{character.name}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">{character.name}</h1>
                {character.anime_name && (
                  <Link href={`/anime/${character.anime_slug}`} className="text-[#D4AF37] hover:underline">
                    {character.anime_name}
                  </Link>
                )}
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  <span>{character.artwork_count} artworks</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Artworks */}
        <div className="max-w-[1800px] mx-auto px-4 py-8">
          <h2 className="text-xl font-bold mb-6">Artwork by {character.name}</h2>
          <MasonryGrid character={character.id} limit={50} />
        </div>
      </main>
    </div>
  );
}
