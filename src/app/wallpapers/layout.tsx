import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anime Wallpapers for Phone and Desktop",
  description: "Browse download-ready anime wallpapers for phone and desktop on AniPins.",
  alternates: { canonical: "/wallpapers" },
};

export default function WallpaperLayout({ children }: { children: React.ReactNode }) {
  return children;
}
