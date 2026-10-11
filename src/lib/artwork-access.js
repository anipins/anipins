/** Draft images belong to the admin workflow, not public download links. */
function mayDownloadArtwork(art, user) {
  if (!art) return false;
  return Number(art.published || 0) === 1 || user?.role === "ADMIN";
}

module.exports = { mayDownloadArtwork };
