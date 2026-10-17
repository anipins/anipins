import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "AniPins — Anime Artwork",
    short_name: "AniPins",
    description: "Discover, save and download anime artwork.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#101010",
    theme_color: "#101010",
    icons: [
      { src: "/brand/ap-symbol-192.png?v=gold-20261016", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/ap-symbol-512.png?v=gold-20261016", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
