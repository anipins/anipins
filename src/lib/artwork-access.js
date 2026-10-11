/** Draft images belong to the admin workflow, not public download links. */
function mayDownloadArtwork(art, user) {
  if (!art) return false;
  return Number(art.published || 0) === 1 || user?.role === "ADMIN";
}

/** Admins can preview staged uploads; visitors can only read published artwork. */
function mayReadArtworkMedia(art, user) {
  return user?.role === "ADMIN" || Boolean(art && Number(art.published || 0) === 1);
}

module.exports = { mayDownloadArtwork, mayReadArtworkMedia };
