/** Keep the clicked card's decoded thumbnail available during detail loading. */
function makeArtworkPreview(artwork, image) {
  if (!artwork) return artwork;
  const thumbUrl = image?.currentSrc || image?.src || artwork.thumb_url;
  return thumbUrl ? { ...artwork, thumb_url: thumbUrl } : artwork;
}

/** Detail metadata has a fresh signed URL; the tapped image is already decoded. */
function preserveArtworkPreview(detail, preview) {
  if (!detail || !preview || detail.id !== preview.id || !preview.thumb_url) return detail;
  return { ...detail, thumb_url: preview.thumb_url };
}

module.exports = { makeArtworkPreview, preserveArtworkPreview };
