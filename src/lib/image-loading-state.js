/** Some cached images complete before React attaches an onLoad handler. */
function isImageAlreadyLoaded(image) {
  return Boolean(image && image.complete && image.naturalWidth > 0);
}

module.exports = { isImageAlreadyLoaded };
