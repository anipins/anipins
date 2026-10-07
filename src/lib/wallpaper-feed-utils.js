const WALLPAPER_PREDICATE = "(lower(category) = 'wallpapers' OR COALESCE(lower(tags), '') LIKE '%wallpaper%')";

function wallpaperFilter() {
  return WALLPAPER_PREDICATE;
}

function nonWallpaperFilter() {
  return `(NOT ${WALLPAPER_PREDICATE})`;
}

module.exports = { wallpaperFilter, nonWallpaperFilter };
