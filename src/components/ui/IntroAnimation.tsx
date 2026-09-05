'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0); // 0=logo, 1=text, 2=fadeout

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 1800);
    const t3 = setTimeout(() => onComplete(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-[#0A0A0A] flex items-center justify-center transition-opacity duration-500 ${phase === 2 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* AP Symbol - exact from original website */}
        <div className={`transition-all duration-700 ease-out ${phase >= 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <div className="relative w-24 h-24 md:w-32 md:h-32">
            {/* Gold glow behind */}
            <div className="absolute inset-0 rounded-[20px] bg-gradient-to-br from-[#D4AF37]/20 to-transparent blur-xl animate-pulse" />
            {/* The actual AP symbol from the original site */}
            <img 
              src="/brand/ap-symbol-intro.png" 
              alt="AniPins" 
              className="relative w-full h-full rounded-[20px] drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              style={{ 
                animation: phase === 0 ? 'introGlow 1.5s ease-in-out infinite' : undefined 
              }}
            />
          </div>
        </div>

        {/* Wordmark */}
        <div className={`text-center transition-all duration-500 ease-out ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <span className="text-white">Ani</span>
            <span className="text-[#D4AF37]">Pins</span>
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1 tracking-widest uppercase" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
            Discover · Save · Create
          </p>
        </div>

        {/* Loading dots */}
        <div className={`flex gap-1.5 transition-opacity duration-300 ${phase >= 1 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-1 h-1 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-1 rounded-full bg-[#D4AF37] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      <style jsx global>{`
        @keyframes introGlow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(212,175,55,0.2)); }
          50% { filter: drop-shadow(0 0 40px rgba(212,175,55,0.4)); }
        }
      `}</style>
    </div>
  );
}
