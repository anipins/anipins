function isInstagramInAppBrowser(userAgent) {
  return /Instagram/i.test(String(userAgent || ""));
}

module.exports = { isInstagramInAppBrowser };
