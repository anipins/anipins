'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import MasonryGrid from '@/components/artwork/MasonryGrid';

export default function CollectionsPage() {
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/saves').then(r => r.json()).then(d => {
      setSaved(d.saves || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-[1800px] mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-2">My Collections</h1>
          <p className="text-gray-500 mb-8">Your saved artwork and collections.</p>

          {saved.length > 0 ? (
            <MasonryGrid limit={30} />
          ) : !loading ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-semibold mb-2">No saved artwork yet</h3>
              <p className="text-gray-500">Save artwork by clicking the bookmark icon on any artwork card</p>
            </div>
          ) : (
            <div className="flex justify-center py-20"><div className="spinner" /></div>
          )}
        </div>
      </main>
    </div>
  );
}
