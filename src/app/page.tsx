'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import MasonryGrid from '@/components/artwork/MasonryGrid';
import IntroAnimation from '@/components/ui/IntroAnimation';
import { proxyUrl } from '@/lib/utils';

export default function HomePage() {
  const [featured, setFeatured] = useState<any[]>([]);
  const [trendingChars, setTrendingChars] = useState<any[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<any[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  useEffect(() => {
    // Seed and load data
    fetch('/api/admin/seed', { method: 'POST' }).then(() => {
      Promise.all([
        fetch('/api/artworks?featured=1&limit=8').then(r => r.json()),
        fetch('/api/characters?sort=popular&limit=10').then(r => r.json()),
        fetch('/api/anime?sort=popular&limit=10').then(r => r.json()),
      ]).then(([featData, charData, animeData]) => {
        setFeatured(featData.artworks || []);
        setTrendingChars(charData.characters || []);
        setTrendingAnime(animeData.anime || []);
        setDataLoaded(true);
      });
    });
  }, []);

  useEffect(() => {
    if (featured.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide(p => (p + 1) % featured.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [featured.length]);

  return (
    <div className="min-h-screen bg-[#080808]" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Intro Animation - matches original website */}
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      <Navbar />
      
      <main className="pt-20 md:pt-24 pb-20 md:pb-8">
        {/* Featured Hero Slider */}
        {featured.length > 0 && (
          <section className="mx-auto max-w-[1600px] px-4 md:px-8 pt-4">
            <div className="relative overflow-hidden rounded-3xl" style={{ height: 'min(60vh, 480px)' }}>
              {featured.map((art: any, i: number) => (
                <div key={art.id}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out ${i === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}>
                  <img 
                    src={proxyUrl(art.image_url || art.thumbnail_url)} 
                    alt={art.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/50 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/70 to-transparent" />
                </div>
              ))}
              
              <div className="relative z-10 h-full flex items-end">
                <div className="px-8 pb-10 md:px-12 md:pb-12 w-full">
                  <div className="max-w-lg">
                    <span className="inline-block text-[#D4AF37] text-xs font-medium mb-3 tracking-[0.2em] uppercase">Featured</span>
                    <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight tracking-tight" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
                      {featured[currentSlide]?.title || 'Discover Anime Art'}
                    </h1>
                    <p className="text-gray-300 text-sm md:text-base mb-6">
                      {featured[currentSlide]?.character_name && (
                        <>{featured[currentSlide].character_name} · {featured[currentSlide].anime_name}</>
                      )}
                    </p>
                    <div className="flex gap-3">
                      <Link href={`/artwork/${featured[currentSlide]?.id}`}
                        className="px-6 py-3 rounded-full bg-[#D4AF37] text-black text-sm font-medium hover:bg-[#C6A15B] transition-colors">
                        View Artwork
                      </Link>
                      <Link href="/explore"
                        className="px-6 py-3 rounded-full bg-white/10 text-sm font-medium hover:bg-white/20 transition-colors">
                        Explore All
                      </Link>
                    </div>
                  </div>

                  {/* Slide counter & indicators */}
                  <div className="flex items-center gap-4 mt-6">
                    <span className="text-white/60 text-xs font-mono">
                      {String(currentSlide + 1).padStart(2, '0')} / {String(featured.length).padStart(2, '0')}
                    </span>
                    <div className="flex gap-1.5">
                      {featured.map((_: any, i: number) => (
                        <button key={i} onClick={() => setCurrentSlide(i)}
                          className={`h-1 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 bg-[#D4AF37]' : 'w-4 bg-white/20 hover:bg-white/30'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow controls */}
              <button onClick={() => setCurrentSlide(p => (p - 1 + featured.length) % featured.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors text-white/80 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => setCurrentSlide(p => (p + 1) % featured.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors text-white/80 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </section>
        )}

        {/* The Feed - matches original layout */}
        <section className="mx-auto max-w-[1600px] px-4 md:px-8 pt-14">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold md:text-3xl tracking-tight" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>The Feed</h2>
              <p className="mt-1 text-sm text-gray-400">Fresh artwork, endlessly.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Trending', href: '/explore?sort=trending' },
                { label: 'Latest', href: '/explore?sort=latest' },
                { label: 'Popular', href: '/explore?sort=popular' },
                { label: 'Characters', href: '/characters' },
                { label: 'Anime', href: '/anime' },
                { label: 'Male Characters', href: '/explore?category=Male%20Characters' },
                { label: 'Female Characters', href: '/explore?category=Female%20Characters' },
              ].map(link => (
                <Link key={link.href} href={link.href}
                  className="rounded-full px-4 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 border border-white/[0.06] transition-all">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <MasonryGrid sort="latest" limit={30} />
        </section>

        {/* Trending Characters - horizontal scroll like original */}
        {trendingChars.length > 0 && (
          <section className="mx-auto max-w-[1600px] px-4 md:px-8 pt-16">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">Trending Characters</h2>
              <Link href="/characters" className="text-sm text-[#D4AF37] hover:text-[#C6A15B] transition-colors">View all →</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
              {trendingChars.map((char: any) => (
                <Link key={char.id} href={`/characters/${char.slug}`} className="shrink-0 group">
                  <div className="w-36 md:w-44">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-2 bg-[#111]">
                      <img src={proxyUrl(char.thumbnail_url)} alt={char.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <p className="text-sm font-medium truncate">{char.name}</p>
                    <p className="text-xs text-gray-500">{char.artwork_count} artworks</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Trending Anime */}
        {trendingAnime.length > 0 && (
          <section className="mx-auto max-w-[1600px] px-4 md:px-8 pt-16">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">Trending Anime</h2>
              <Link href="/anime" className="text-sm text-[#D4AF37] hover:text-[#C6A15B] transition-colors">View all →</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
              {trendingAnime.map((anime: any) => (
                <Link key={anime.id} href={`/anime/${anime.slug}`} className="shrink-0 group">
                  <div className="w-48 md:w-56">
                    <div className="relative aspect-video rounded-2xl overflow-hidden mb-2 bg-[#111]">
                      <img src={proxyUrl(anime.cover_url)} alt={anime.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                    <p className="text-sm font-medium truncate">{anime.name}</p>
                    <p className="text-xs text-gray-500">{anime.artwork_count} artworks · {anime.character_count} characters</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Instagram CTA */}
        <section className="mx-auto max-w-[1600px] px-4 md:px-8 pt-16">
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-r from-[#111] via-[#151515] to-[#111] p-8 md:p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">Follow Us on Instagram</h3>
            <p className="text-gray-400 text-sm mb-6">Daily anime art drops and character features.</p>
            <a href="https://www.instagram.com/_anipins_?igsi=dzZzem42bnBha3Y=" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
              </svg>
              @_anipins_
            </a>
          </div>
        </section>

        {/* Footer - matches original */}
        <footer className="mx-auto max-w-[1600px] px-6 md:px-8 mt-24 border-t border-white/10">
          <div className="py-14 grid gap-10 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5">
                <img src="/brand/ap-symbol.svg" alt="" className="h-9 w-9 rounded-[10px]" />
                <span className="text-xl font-semibold tracking-tight">
                  <span className="text-white">Ani</span>
                  <span className="text-[#D4AF37]">Pins</span>
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-400">Anime artwork for inspiration.</p>
              <a href="https://www.instagram.com/_anipins_?igsi=dzZzem42bnBha3Y=" target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
                </svg>
                Instagram — @_anipins_
              </a>
            </div>
            <div className="flex gap-16 text-sm">
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] uppercase tracking-widest text-[#D4AF37]/70 mb-1">Browse</span>
                <Link className="text-gray-400 hover:text-white transition-colors" href="/explore">Explore</Link>
                <Link className="text-gray-400 hover:text-white transition-colors" href="/characters">Characters</Link>
                <Link className="text-gray-400 hover:text-white transition-colors" href="/anime">Anime</Link>
                <a href="https://www.instagram.com/_anipins_?igsi=dzZzem42bnBha3Y=" target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors">Instagram</a>
              </div>
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] uppercase tracking-widest text-[#D4AF37]/70 mb-1">Legal</span>
                <Link className="text-gray-400 hover:text-white transition-colors" href="/privacy">Privacy</Link>
                <Link className="text-gray-400 hover:text-white transition-colors" href="/terms">Terms</Link>
                <Link className="text-gray-400 hover:text-white transition-colors" href="/copyright">Copyright / Takedown</Link>
              </div>
            </div>
            <div className="md:text-right text-sm text-gray-500 self-end">
              © AniPins. All rights reserved.
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
