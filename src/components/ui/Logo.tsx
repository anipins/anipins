'use client';

import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'symbol' | 'wordmark';
  animated?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', variant = 'full', animated = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { symbol: 32, text: 'text-sm', ring: 28, inner: 14 },
    md: { symbol: 40, text: 'text-lg', ring: 36, inner: 18 },
    lg: { symbol: 56, text: 'text-2xl', ring: 50, inner: 24 },
    xl: { symbol: 80, text: 'text-4xl', ring: 72, inner: 36 },
  };

  const s = sizes[size];

  const Symbol = () => (
    <div className="relative" style={{ width: s.symbol, height: s.symbol }}>
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full" style={{
        background: 'conic-gradient(from 0deg, rgba(212,175,55,0.3), rgba(198,161,91,0.1), rgba(184,149,79,0.3))',
        filter: 'blur(1px)',
      }} />
      
      {/* Main ring */}
      <svg className="absolute inset-0" width={s.symbol} height={s.symbol} viewBox="0 0 100 100">
        {/* Outer circle */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="url(#goldGradient)" strokeWidth="1.5" opacity="0.6" />
        
        {/* Inner decorative circles */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="url(#goldGradient)" strokeWidth="0.5" opacity="0.3" strokeDasharray="4 6" />
        
        {/* Orbital dots */}
        <circle cx="50" cy="8" r="2" fill="#D4AF37" opacity="0.8">
          {animated && (
            <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite" />
          )}
        </circle>
        <circle cx="92" cy="50" r="1.5" fill="#C6A15B" opacity="0.6">
          {animated && (
            <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="-360 50 50" dur="25s" repeatCount="indefinite" />
          )}
        </circle>
        <circle cx="50" cy="92" r="1" fill="#B8954F" opacity="0.5">
          {animated && (
            <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="30s" repeatCount="indefinite" />
          )}
        </circle>
        
        {/* Sparkle accents */}
        <line x1="20" y1="20" x2="22" y2="22" stroke="#D4AF37" strokeWidth="1" opacity="0.4">
          {animated && <animate attributeName="opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />}
        </line>
        <line x1="78" y1="22" x2="80" y2="20" stroke="#D4AF37" strokeWidth="1" opacity="0.4">
          {animated && <animate attributeName="opacity" values="0.4;0.2;0.4" dur="4s" repeatCount="indefinite" />}
        </line>
        
        {/* Gold gradient definition */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#C6A15B" />
            <stop offset="100%" stopColor="#B8954F" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* AP Monogram */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-black tracking-tighter" style={{
          fontSize: s.inner,
          background: 'linear-gradient(135deg, #D4AF37 0%, #E8D48B 30%, #D4AF37 60%, #B8954F 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: 'none',
          filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.3))',
        }}>AP</span>
      </div>
    </div>
  );

  if (variant === 'symbol') return <Symbol />;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Symbol />
      {variant === 'full' && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight ${s.text}`}>
            <span className="text-white">Ani</span>
            <span style={{
              background: 'linear-gradient(135deg, #D4AF37, #C6A15B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Pins</span>
          </span>
          {size === 'lg' || size === 'xl' ? (
            <span className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">Discover · Save · Create</span>
          ) : null}
        </div>
      )}
    </div>
  );
}
