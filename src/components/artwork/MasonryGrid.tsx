'use client';

import { useState, useEffect, useCallback } from 'react';
import Masonry from 'react-masonry-css';
import ArtworkCard from './ArtworkCard';
import { proxyUrl } from '@/lib/utils';

interface Artwork {
  id: string;
  title: string;
  thumbnail_url: string;
  image_url: string;
  character_name?: string;
  character_slug?: string;
  anime_name?: string;
  anime_slug?: string;
  like_count: number;
  save_count: number;
  view_count: number;
}

interface Props {
  initialArtworks?: Artwork[];
  sort?: string;
  category?: string;
  anime?: string;
  character?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
}

export default function MasonryGrid({ initialArtworks, sort = 'latest', category, anime, character, search, featured, limit = 30 }: Props) {
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks || []);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(!initialArtworks);
  const [likes, setLikes] = useState<Set<string>>(new Set());
  const [saves, setSaves] = useState<Set<string>>(new Set());

  const fetchArtworks = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', String(limit));
      if (sort) params.set('sort', sort);
      if (category) params.set('category', category);
      if (anime) params.set('anime', anime);
      if (character) params.set('character', character);
      if (search) params.set('q', search);
      if (featured) params.set('featured', '1');

      const res = await fetch(`/api/artworks?${params}`);
      const data = await res.json();
      
      if (append) {
        setArtworks(prev => [...prev, ...data.artworks]);
      } else {
        setArtworks(data.artworks || []);
      }
      setHasMore(data.pagination?.hasMore || false);
    } catch (error) {
      console.error('Fetch artworks error:', error);
    }
    setLoading(false);
  }, [sort, category, anime, character, search, featured, limit]);

  useEffect(() => {
    if (!initialArtworks) {
      fetchArtworks(1);
    }
    // Fetch user likes/saves
    fetch('/api/likes').then(r => r.json()).then(d => setLikes(new Set(d.likes || [])));
    fetch('/api/saves').then(r => r.json()).then(d => setSaves(new Set(d.saves || [])));
  }, []);

  useEffect(() => {
    if (page > 1) {
      fetchArtworks(page, true);
    }
  }, [page]);

  const handleLike = async (artworkId: string) => {
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId }),
      });
      const data = await res.json();
      setLikes(prev => {
        const next = new Set(prev);
        if (data.liked) next.add(artworkId);
        else next.delete(artworkId);
        return next;
      });
    } catch {}
  };

  const handleSave = async (artworkId: string) => {
    try {
      const res = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId }),
      });
      const data = await res.json();
      setSaves(prev => {
        const next = new Set(prev);
        if (data.saved) next.add(artworkId);
        else next.delete(artworkId);
        return next;
      });
    } catch {}
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
    }
  };

  const breakpointColumns = { default: 5, 1536: 5, 1280: 4, 1024: 3, 768: 2, 640: 2 };

  return (
    <div>
      {artworks.length > 0 ? (
        <Masonry
          breakpointCols={breakpointColumns}
          className="masonry-grid"
          columnClassName="masonry-grid-col"
        >
          {artworks.map((artwork, index) => (
            <div key={artwork.id} className="animate-fadeInUp" style={{ animationDelay: `${Math.min(index * 50, 500)}ms` }}>
              <ArtworkCard
                artwork={artwork}
                onLike={handleLike}
                onSave={handleSave}
                isLiked={likes.has(artwork.id)}
                isSaved={saves.has(artwork.id)}
              />
            </div>
          ))}
        </Masonry>
      ) : !loading ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-xl font-semibold mb-2">No artworks found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : null}

      {loading && (
        <div className="flex justify-center py-8">
          <div className="spinner" />
        </div>
      )}

      {hasMore && artworks.length > 0 && !loading && (
        <div className="flex justify-center py-8">
          <button
            onClick={loadMore}
            className="px-8 py-3 rounded-full bg-[#181818] border border-white/10 text-sm font-medium hover:bg-[#222] hover:border-[#D4AF37]/30 transition-all"
          >
            Load More Artwork
          </button>
        </div>
      )}
    </div>
  );
}
