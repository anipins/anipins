import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AniPins — Discover. Save. Create.",
  description: "Anime artwork curated for inspiration. Discover, save, share and download high-quality anime character art.",
  keywords: "anime, anime art, anime wallpapers, anime characters, manga, fan art, wallpapers",
  icons: {
    icon: '/favicon.svg',
    apple: '/brand/ap-symbol-192.png',
  },
  openGraph: {
    title: "AniPins — Discover. Save. Create.",
    description: "Anime artwork curated for inspiration.",
    url: "https://anipins-three.vercel.app",
    siteName: "AniPins",
    images: [{ url: "https://anipins-three.vercel.app/brand/og-image.png" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AniPins — Discover. Save. Create.",
    description: "Anime artwork curated for inspiration.",
    images: ["https://anipins-three.vercel.app/brand/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#080808] text-white antialiased" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
