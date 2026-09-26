import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { rows } from "@/lib/db";
import { artworkAlt } from "@/lib/site";

export const dynamic = "force-dynamic";
const SIZE = 48;
type Props = { searchParams: Promise<{ page?: string }> };
function pageNumber(value?: string) {
  if (value !== undefined && !/^[1-9]\d{0,5}$/.test(value)) notFound();
  return Number(value || 1);
}
const pageUrl = (page: number) => page === 1 ? "/gallery" : `/gallery?page=${page}`;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const page = pageNumber((await searchParams).page);
  return { title: `Anime Artwork Gallery${page > 1 ? ` — Page ${page}` : ""}`, description: "Browse the complete AniPins artwork collection by character and anime series.", alternates: { canonical: pageUrl(page) } };
}

export default async function Gallery({ searchParams }: Props) {
  const page = pageNumber((await searchParams).page);
  const items = await rows("SELECT id, title, character_name, anime_name, thumb, width, height FROM artworks WHERE published=1 ORDER BY id ASC LIMIT ? OFFSET ?", SIZE + 1, (page - 1) * SIZE);
  if (page > 1 && !items.length) notFound();
  return <section className="w-full px-4 pt-28 md:px-8 md:pt-32">
    <h1 className="font-display text-3xl font-semibold">All anime artwork{page > 1 ? ` · Page ${page}` : ""}</h1>
    <p className="mt-3 mb-8 text-fog">Browse the full collection. Open an artwork to view details, save it, or download it.</p>
    <div className="masonry">{items.slice(0, SIZE).map(art => <Link prefetch={false} key={art.id} href={`/a/${art.id}`} className="mb-4 block overflow-hidden rounded-2xl bg-soft">
      <img src={`/api/img/${art.thumb}`} alt={artworkAlt(art)} width={art.width || 600} height={art.height || 800} loading="lazy" className="h-auto w-full" />
      <div className="p-3"><h2 className="font-medium">{art.title || art.character_name}</h2><p className="text-sm text-fog">{art.character_name} · {art.anime_name}</p></div>
    </Link>)}</div>
    <nav aria-label="Gallery pages" className="flex items-center justify-center gap-6 py-10">
      {page > 1 && <Link prefetch={false} href={pageUrl(page - 1)} className="btn-ghost">← Previous</Link>}
      <span>Page {page}</span>
      {items.length > SIZE && <Link prefetch={false} href={pageUrl(page + 1)} className="btn-primary">Next →</Link>}
    </nav>
  </section>;
}
