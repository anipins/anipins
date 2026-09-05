'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: string;
  avatar_url?: string;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({ characters: [], anime: [], artworks: [] });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupMode, setSignupMode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.user) setUser(d.user);
    });
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          .then(r => r.json())
          .then(d => setSearchResults(d));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults({ characters: [], anime: [], artworks: [] });
    }
  }, [searchQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const endpoint = signupMode ? '/api/auth/signup' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.error) {
        setAuthError(data.error);
      } else {
        setUser(data.user);
        setShowLogin(false);
        setLoginForm({ email: '', password: '' });
      }
    } catch {
      setAuthError('Connection failed');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setShowUserMenu(false);
    router.push('/');
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-[1800px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo - using original brand asset */}
          <Link href="/" className="shrink-0 flex items-center gap-2.5 group" aria-label="AniPins home">
            <img src="/brand/ap-symbol.svg" alt="" className="h-9 w-9 rounded-[10px] transition-shadow duration-300 group-hover:shadow-[0_0_18px_rgba(198,161,91,0.35)]" />
            <span className="font-semibold text-lg tracking-tight hidden sm:block" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
              <span className="text-white">Ani</span>
              <span className="text-[#D4AF37]">Pins</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/" className="px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Home</Link>
            <Link href="/explore" className="px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Explore</Link>
            <Link href="/characters" className="px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Characters</Link>
            <Link href="/anime" className="px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">Anime</Link>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xl relative" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search characters, anime, art..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
                className="w-full h-10 pl-10 pr-4 rounded-full bg-[#181818] border border-white/10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]/40 transition-colors"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Search Dropdown */}
            {showSearch && searchQuery.length >= 2 && (
              <div className="absolute top-12 left-0 right-0 bg-[#181818] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto">
                {searchResults.characters.length > 0 && (
                  <div className="p-3">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Characters</div>
                    {searchResults.characters.map((c: any) => (
                      <Link key={c.id} href={`/characters/${c.slug}`} onClick={() => setShowSearch(false)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <img src={c.thumbnail_url} alt={c.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <div className="text-sm font-medium">{c.name}</div>
                          <div className="text-xs text-gray-500">{c.anime_name}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.anime.length > 0 && (
                  <div className="p-3 border-t border-white/5">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Anime</div>
                    {searchResults.anime.map((a: any) => (
                      <Link key={a.id} href={`/anime/${a.slug}`} onClick={() => setShowSearch(false)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <img src={a.cover_url} alt={a.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <div className="text-sm font-medium">{a.name}</div>
                          <div className="text-xs text-gray-500">{a.artwork_count} artworks</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.artworks.length > 0 && (
                  <div className="p-3 border-t border-white/5">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Artwork</div>
                    {searchResults.artworks.map((a: any) => (
                      <Link key={a.id} href={`/artwork/${a.id}`} onClick={() => setShowSearch(false)}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <img src={a.thumbnail_url} alt={a.title} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <div className="text-sm font-medium">{a.title}</div>
                          <div className="text-xs text-gray-500">{a.character_name} · {a.anime_name}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.characters.length === 0 && searchResults.anime.length === 0 && searchResults.artworks.length === 0 && (
                  <div className="p-6 text-center text-gray-500 text-sm">No results found</div>
                )}
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Instagram */}
            <a href="https://www.instagram.com/_anipins_?igsi=dzZzem42bnBha3Y=" target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-400 hover:text-[#D4AF37] transition-colors" title="@_anipins_">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>

            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin/dashboard" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-colors">
                    Admin
                  </Link>
                )}
                <div className="relative">
                  <button onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
                      <span className="text-[#D4AF37] text-xs font-bold">{user.display_name?.[0]?.toUpperCase() || 'U'}</span>
                    </div>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-12 w-56 bg-[#181818] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      <div className="p-3 border-b border-white/5">
                        <div className="text-sm font-medium">{user.display_name}</div>
                        <div className="text-xs text-gray-500">@{user.username}</div>
                        {user.role === 'super_admin' && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] rounded-full border border-[#D4AF37]/30">SUPER ADMIN</span>
                        )}
                      </div>
                      <Link href={`/profile/${user.username}`} onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">Profile</Link>
                      <Link href="/collections" onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">My Collections</Link>
                      <button onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors">Sign Out</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button onClick={() => setShowLogin(true)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-[#D4AF37] text-black hover:bg-[#C6A15B] transition-colors">
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowLogin(false)}>
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <img src="/brand/ap-symbol.svg" alt="AniPins" className="h-16 w-16 rounded-[14px] drop-shadow-[0_0_20px_rgba(212,175,55,0.2)]" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">{signupMode ? 'Join AniPins' : 'Welcome Back'}</h2>
              <p className="text-sm text-gray-500 mt-1">{signupMode ? 'Create your account' : 'Sign in to continue'}</p>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{authError}</div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                <input type="email" required value={loginForm.email} onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full h-11 px-4 rounded-lg bg-[#181818] border border-white/10 text-white text-sm focus:outline-none focus:border-[#D4AF37]/40 transition-colors"
                  placeholder="your@email.com" />
              </div>
              {signupMode && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Username</label>
                  <input type="text" value={loginForm.email.split('@')[0]} readOnly
                    className="w-full h-11 px-4 rounded-lg bg-[#181818] border border-white/10 text-gray-500 text-sm" />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Password</label>
                <input type="password" required value={loginForm.password} onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full h-11 px-4 rounded-lg bg-[#181818] border border-white/10 text-white text-sm focus:outline-none focus:border-[#D4AF37]/40 transition-colors"
                  placeholder="••••••••" minLength={6} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-11 rounded-lg bg-[#D4AF37] text-black font-semibold hover:bg-[#C6A15B] transition-colors disabled:opacity-50">
                {loading ? 'Please wait...' : signupMode ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              {signupMode ? 'Already have an account?' : "Don't have an account?"}
              <button onClick={() => { setSignupMode(!signupMode); setAuthError(''); }}
                className="text-[#D4AF37] hover:underline ml-1">{signupMode ? 'Sign In' : 'Sign Up'}</button>
            </p>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 safe-bottom">
        <div className="flex items-center justify-around h-14">
          <Link href="/" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-[#D4AF37] transition-colors px-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-[10px]">Home</span>
          </Link>
          <Link href="/explore" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-[#D4AF37] transition-colors px-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            <span className="text-[10px]">Explore</span>
          </Link>
          <Link href="/search" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-[#D4AF37] transition-colors px-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <span className="text-[10px]">Search</span>
          </Link>
          <Link href="/collections" className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-[#D4AF37] transition-colors px-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            <span className="text-[10px]">Saved</span>
          </Link>
          <Link href={user ? `/profile/${user.username}` : '#'} onClick={() => !user && setShowLogin(true)}
            className="flex flex-col items-center gap-0.5 text-gray-400 hover:text-[#D4AF37] transition-colors px-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-[10px]">Profile</span>
          </Link>
        </div>
      </div>
    </>
  );
}
