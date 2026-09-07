import type { Metadata } from "next";
import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Intro from "@/components/Intro";
import Toaster from "@/components/Toaster";
import ArtLightbox from "@/components/ArtLightbox";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export const metadata: Metadata = {
  title: "AniPins — Discover. Save. Create.",
  description: "Anime artwork curated for inspiration. Discover, save, share and download high-quality anime character art.",
  icons: { icon: "/favicon.svg", apple: "/brand/ap-symbol-192.png" },
  openGraph: {
    title: "AniPins — Discover. Save. Create.",
    description: "Anime artwork curated for inspiration.",
    images: ["/brand/og-image.png"],
    siteName: "AniPins",
  },
  twitter: { card: "summary_large_image", images: ["/brand/og-image.png"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body>
        <Intro />
        <Navbar />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
        <Toaster />
        <ArtLightbox />
      </body>
    </html>
  );
}
