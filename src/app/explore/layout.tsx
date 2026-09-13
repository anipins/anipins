import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Anime Artwork",
  description: "Explore the complete AniPins gallery of curated anime and character artwork.",
  alternates: { canonical: "/explore" },
  openGraph: { title: "Explore Anime Artwork | AniPins", description: "Browse the complete AniPins anime artwork gallery.", url: "/explore" },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) { return children; }
