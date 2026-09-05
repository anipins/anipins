'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import MasonryGrid from '@/components/artwork/MasonryGrid';

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialSort = searchParams.get('sort') || 'latest';
  const initialCategory = searchParams.get('category') || '';
  const [sort, setSort] = useState(initialSort);
  const [category, setCategory] = useState(initialCategory);

  const categories = [
    { label: 'All', value: '' },
    { label: 'Male Characters', value: 'Male Characters' },
    { label: 'Female Characters', value: 'Female Characters' },
  ];

  const sorts = [
    { label: 'Latest', value: 'latest' },
    { label: 'Trending', value: 'trending' },
    { label: 'Popular', value: 'popular' },
  ];

  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-[1800px] mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">Explore</h1>
          <p className="text-gray-500 mb-8">Browse the full AniPins gallery.</p>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            {sorts.map(s => (
              <button key={s.value} onClick={() => setSort(s.value)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${sort === s.value ? 'bg-[#D4AF37] text-black font-medium' : 'bg-[#181818] border border-white/10 hover:border-[#D4AF37]/30'}`}>
                {s.label}
              </button>
            ))}
            <div className="w-px bg-white/10 mx-1" />
            {categories.map(c => (
              <button key={c.value} onClick={() => setCategory(c.value)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${category === c.value ? 'bg-[#D4AF37] text-black font-medium' : 'bg-[#181818] border border-white/10 hover:border-[#D4AF37]/30'}`}>
                {c.label}
              </button>
            ))}
          </div>

          <MasonryGrid key={`${sort}-${category}`} sort={sort} category={category || undefined} limit={30} />
        </div>
      </main>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080808] flex items-center justify-center"><div className="spinner" /></div>}>
      <ExploreContent />
    </Suspense>
  );
}
