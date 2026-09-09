import type { Metadata } from "next";
import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Intro from "@/components/Intro";
import Toaster from "@/components/Toaster";
import ArtLightbox from "@/components/ArtLightbox";
import MobileBottomNav from "@/components/MobileBottomNav";
import PullToRefresh from "@/components/PullToRefresh";
import AppUpdateBanner from "@/components/AppUpdateBanner";
import ClientTelemetry from "@/components/ClientTelemetry";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export const metadata: Metadata = {
  metadataBase: new URL("https://anipins-three.vercel.app"),
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
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("anipins-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`,
          }}
        />
      </head>
      <body>
        <Intro />
        <Navbar />
        <PullToRefresh />
        <main className="min-h-[70vh] pb-20 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        <Toaster />
        <ArtLightbox />
        <AppUpdateBanner />
        <ClientTelemetry />
      </body>
    </html>
  );
}
