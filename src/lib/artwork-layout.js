function getArtworkImageFit({ width, height }) {
  const ratio = width && height ? height / width : 1.3;
  return ratio < 0.9 ? "contain" : "cover";
}

module.exports = { getArtworkImageFit };
