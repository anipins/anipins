'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  artwork: Artwork;
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
  isLiked?: boolean;
  isSaved?: boolean;
}

export default function ArtworkCard({ artwork, onLike, onSave, isLiked, isSaved }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const thumbSrc = proxyUrl(artwork.thumbnail_url);
  const imgSrc = proxyUrl(artwork.image_url);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(imgSrc);
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
      window.open(imgSrc, '_blank');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/artwork/${artwork.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: artwork.title, url }); } catch {}
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div
      className="artwork-card group relative rounded-2xl overflow-hidden bg-[#111] mb-4 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/artwork/${artwork.id}`}>
        {/* Image */}
        <div className="relative">
          {!loaded && (
            <div className="skeleton w-full" style={{ paddingBottom: '140%' }} />
          )}
          <img
            src={thumbSrc}
            alt={artwork.title}
            className={`w-full block transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="400" fill="%23181818"%3E%3Crect width="300" height="400"/%3E%3Ctext x="150" y="200" text-anchor="middle" fill="%23333" font-size="14"%3EImage%3C/text%3E%3C/svg%3E';
              setLoaded(true);
            }}
          />

          {/* Hover Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            {/* Top actions */}
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={handleDownload}
                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-[#D4AF37] hover:text-black transition-all"
                title="Download"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-[#D4AF37] hover:text-black transition-all"
                title="Share"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              </button>
            </div>

            {/* Bottom actions */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <div className="min-w-0">
                {artwork.character_name && (
                  <p className="text-white text-sm font-medium truncate">{artwork.character_name}</p>
                )}
                {artwork.anime_name && (
                  <p className="text-gray-300 text-xs truncate">{artwork.anime_name}</p>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLike?.(artwork.id); }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isLiked ? 'bg-red-500 text-white' : 'bg-black/60 text-white hover:bg-red-500'}`}
                  title="Like"
                >
                  <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave?.(artwork.id); }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSaved ? 'bg-[#D4AF37] text-black' : 'bg-black/60 text-white hover:bg-[#D4AF37] hover:text-black'}`}
                  title="Save"
                >
                  <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
