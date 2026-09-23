import type { Metadata, Viewport } from "next";
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
import JsonLd from "@/components/JsonLd";
import NativeExternalLinks from "@/components/NativeExternalLinks";
import { absoluteUrl, getSiteUrl, SITE_NAME } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "AniPins — Discover, Save and Download Anime Artwork", template: "%s | AniPins" },
  description: "Anime artwork curated for inspiration. Discover, save, share and download high-quality anime character art.",
  applicationName: SITE_NAME,
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  icons: { icon: "/favicon.svg", apple: "/brand/ap-symbol-192.png" },
  openGraph: {
    title: "AniPins — Discover, Save and Download Anime Artwork",
    description: "Anime artwork curated for inspiration.",
    images: ["/brand/og-image.png"],
    siteName: SITE_NAME,
    type: "website",
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "AniPins — Anime Artwork", description: "Discover, save and download high-quality anime character art.", images: ["/brand/og-image.png"] },
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
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`} suppressHydrationWarning>
      <head>
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
