import Link from "next/link";

export default function Logo({ compact = false, responsive = false }: { compact?: boolean; responsive?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-2.5 shrink-0" aria-label="AniPins home">
      <img src="/brand/ap-symbol.svg" alt="" className="h-9 w-9 rounded-[10px] transition-shadow duration-300 group-hover:shadow-[0_0_18px_rgba(198,161,91,0.35)]" />
      {!compact && (
        <span className={`font-display text-xl font-semibold tracking-tight ${responsive ? "hidden sm:inline" : ""}`}>
          Ani<span className="text-gold">Pins</span>
        </span>
      )}
    </Link>
  );
}
