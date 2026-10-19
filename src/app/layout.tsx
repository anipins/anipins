import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Lexend, Lora, Space_Grotesk } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Intro from "@/components/Intro";
import Toaster from "@/components/Toaster";
import ArtLightbox from "@/components/ArtLightbox";
import MobileBottomNav from "@/components/MobileBottomNav";
import PullToRefresh from "@/components/PullToRefresh";
import AppUpdateBanner from "@/components/AppUpdateBanner";
import ClientTelemetry from "@/components/ClientTelemetry";
import CookieConsent from "@/components/CookieConsent";
import JsonLd from "@/components/JsonLd";
import NativeExternalLinks from "@/components/NativeExternalLinks";
import ReliabilityLayer from "@/components/ReliabilityLayer";
import { absoluteUrl, getSiteUrl, SITE_NAME } from "@/lib/site";

const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap" });
const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const lora = Lora({ subsets: ["latin"], variable: "--font-lora", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "AniPins — Discover, Save and Download Anime Artwork", template: "%s | AniPins" },
  description: "Anime artwork references for sketching, character study and creative inspiration. Discover, save, share and download high-quality anime character art.",
  applicationName: SITE_NAME,
  manifest: "/manifest.webmanifest",
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  icons: {
    icon: [
      { url: "/favicon.png?v=gold-20261016", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.png?v=gold-20261016",
    apple: [{ url: "/brand/ap-symbol-192.png?v=gold-20261016", sizes: "192x192", type: "image/png" }],
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
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lexend.variable} ${grotesk.variable} ${lora.variable}`} suppressHydrationWarning>
      <head>
        <meta name="p:domain_verify" content="81812c5729786ec6e9853a47f64afced" />
        <link rel="preload" as="image" href="/brand/ap-symbol-intro.png?v=gold-20261016" fetchPriority="high" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("anipins-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`,
          }}
        />
      </head>
      <body>
        <JsonLd data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": `${getSiteUrl()}/#website`,
              name: SITE_NAME,
              alternateName: "Ani Pins",
              url: getSiteUrl(),
              potentialAction: { "@type": "SearchAction", target: `${absoluteUrl("/search")}?q={search_term_string}`, "query-input": "required name=search_term_string" },
            },
            {
              "@type": "Organization",
              "@id": `${getSiteUrl()}/#organization`,
              name: SITE_NAME,
              alternateName: "Ani Pins",
              url: getSiteUrl(),
              logo: absoluteUrl("/brand/ap-symbol-192.png?v=gold-20261016"),
            },
          ],
        }} />
        <Intro />
        <ReliabilityLayer />
        <Navbar />
        <PullToRefresh />
        <main className="min-h-[70vh] pb-24 md:pb-0">{children}</main>
        <Footer />
        <MobileBottomNav />
        <Toaster />
        <ArtLightbox />
        <AppUpdateBanner />
        <ClientTelemetry />
        <CookieConsent />
        <NativeExternalLinks />
      </body>
    </html>
  );
}
