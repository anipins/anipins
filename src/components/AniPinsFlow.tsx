export default function AniPinsFlow() {
  return (
    <div aria-hidden="true" className="anipins-flow pointer-events-none absolute inset-0 overflow-hidden">
      <svg viewBox="0 0 1200 620" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="anipins-flow-gold" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#C6A15B" stopOpacity="0" />
            <stop offset=".32" stopColor="#F2D08A" stopOpacity=".62" />
            <stop offset=".68" stopColor="#C6A15B" stopOpacity=".28" />
            <stop offset="1" stopColor="#C6A15B" stopOpacity="0" />
          </linearGradient>
          <filter id="anipins-flow-glow" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        <g fill="none" stroke="url(#anipins-flow-gold)">
          <path className="anipins-flow__glow" filter="url(#anipins-flow-glow)" d="M-80 472C142 170 262 586 472 288S812 10 1280 214" />
          <path className="anipins-flow__line anipins-flow__line--one" d="M-80 472C142 170 262 586 472 288S812 10 1280 214" />
          <path className="anipins-flow__line anipins-flow__line--two" d="M-60 548C154 254 312 612 550 328S950 78 1260 152" />
          <path className="anipins-flow__line anipins-flow__line--three" d="M-120 354C130 92 318 510 500 220S846 88 1270 308" />
        </g>
        <g className="anipins-flow__stars" fill="#F2D08A">
          <circle cx="780" cy="150" r="2" /><circle cx="880" cy="110" r="1.5" /><circle cx="980" cy="172" r="2.5" /><circle cx="1060" cy="118" r="1" /><circle cx="720" cy="238" r="1.25" />
        </g>
      </svg>
    </div>
  );
}
