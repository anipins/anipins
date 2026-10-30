/**
 * Avoid prefetching more pages before the visitor interacts. Once scrolling
 * starts, allow follow-up pages while the sentinel remains near the viewport;
 * one initial request is also allowed for a feed shorter than the viewport.
 */
function shouldLoadFromFeedSignal({ armed, canPrime }) {
  return armed || canPrime;
}

function shouldRecheckFeedAfterItemsChange({ armed, sentinelTop, viewportHeight, preloadDistance = 1600 }) {
  return armed && sentinelTop <= viewportHeight + preloadDistance;
}

module.exports = { shouldLoadFromFeedSignal, shouldRecheckFeedAfterItemsChange };
