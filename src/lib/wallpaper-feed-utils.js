const WALLPAPER_PREDICATE = "(lower(category) = 'wallpapers' OR COALESCE(lower(tags), '') LIKE '%wallpaper%')";

function wallpaperFilter() {
  return WALLPAPER_PREDICATE;
}

function nonWallpaperFilter() {
  return `(NOT ${WALLPAPER_PREDICATE})`;
}

function isWallpaperArtwork(art) {
  return String(art?.category || "").toLowerCase() === "wallpapers"
    || String(art?.tags || "").toLowerCase().includes("wallpaper");
}

module.exports = { wallpaperFilter, nonWallpaperFilter, isWallpaperArtwork };
