/** Draft images belong to the admin workflow, not public download links. */
const ADMIN_EMAIL = "anipins01@gmail.com";
const isOwnerAdmin = user => user?.role === "ADMIN" && String(user?.email || "").trim().toLowerCase() === ADMIN_EMAIL;

function mayDownloadArtwork(art, user) {
  if (!art) return false;
  return Number(art.published || 0) === 1 || isOwnerAdmin(user);
}

/** Admins can preview staged uploads; visitors can only read published artwork. */
function mayReadArtworkMedia(art, user) {
  return isOwnerAdmin(user) || Boolean(art && Number(art.published || 0) === 1);
}

module.exports = { mayDownloadArtwork, mayReadArtworkMedia };
