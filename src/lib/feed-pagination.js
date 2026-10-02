/**
 * A bottom-of-feed signal may be delivered more than once while the same
 * sentinel remains visible. Keep that from turning one scroll into a request
 * for the entire catalogue.
 */
function shouldRequestNextPage(lastRequestScrollY, currentScrollY) {
  // A real user scroll is enough to permit another page. Layout changes after
  // appending a page are not: those used to re-trigger IntersectionObserver
  // and exhaust the whole feed at once.
  return lastRequestScrollY === null || Math.abs(currentScrollY - lastRequestScrollY) >= 80;
}

module.exports = { shouldRequestNextPage };
