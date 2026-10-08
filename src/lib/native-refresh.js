function shouldReloadDocumentForRefresh(isNativeApp) {
  return Boolean(isNativeApp);
}

function nativeRefreshUrl(href, marker) {
  const url = new URL(href);
  url.searchParams.set("anipins_refresh", String(marker));
  return url.toString();
}

module.exports = { nativeRefreshUrl, shouldReloadDocumentForRefresh };
