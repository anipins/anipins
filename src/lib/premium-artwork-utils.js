function premiumArtworkFilter(premiumOnly) {
  return premiumOnly ? "COALESCE(premium, 0) = 1" : "COALESCE(premium, 0) = 0";
}

module.exports = { premiumArtworkFilter };
