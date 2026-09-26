import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Lexend, Space_Grotesk } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Intro from "@/components/Intro";
import Toaster from "@/components/Toaster";
import ArtLightbox from "@/components/ArtLightbox";
import MobileBottomNav from "@/components/MobileBottomNav";
import PullToRefresh from "@/components/PullToRefresh";
import AppUpdateBanner from "@/components/AppUpdateBanner";
import ClientTelemetry from "@/components/ClientTelemetry";
import JsonLd from "@/components/JsonLd";
import NativeExternalLinks from "@/components/NativeExternalLinks";
import { absoluteUrl, getSiteUrl, SITE_NAME } from "@/lib/site";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "AniPins — Discover, Save and Download Anime Artwork", template: "%s | AniPins" },
  description: "Anime artwork references for sketching, character study and creative inspiration. Discover, save, share and download high-quality anime character art.",
  applicationName: SITE_NAME,
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/brand/ap-symbol-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.png",
    apple: [{ url: "/brand/ap-symbol-192.png", sizes: "192x192", type: "image/png" }],
  },
  openGraph: {
    title: "AniPins — Discover, Save and Download Anime Artwork",
    description: "Anime artwork references for sketching, character study and creative inspiration.",
    images: ["/brand/og-image.png"],
    siteName: SITE_NAME,
    type: "website",
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "AniPins — Anime Artwork References", description: "Discover, save and download anime artwork references for sketching and creative inspiration.", images: ["/brand/og-image.png"] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lexend.variable} ${grotesk.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://synqmyiwjyvvrbrhcetw.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://synqmyiwjyvvrbrhcetw.supabase.co" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("anipins-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`,
          }}
        />
      </head>
      <body>
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: getSiteUrl(),
          potentialAction: { "@type": "SearchAction", target: `${absoluteUrl("/search")}?q={search_term_string}`, "query-input": "required name=search_term_string" },
        }} />
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
        <NativeExternalLinks />
      </body>
    </html>
  );
}
