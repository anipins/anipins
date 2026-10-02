/**
 * A bottom-of-feed signal may be delivered more than once while the same
 * sentinel remains visible. Only a new visitor gesture may request another
 * page; one initial request is allowed for a feed shorter than the viewport.
 */
function shouldLoadFromFeedSignal({ armed, canPrime }) {
  return armed || canPrime;
}

module.exports = { shouldLoadFromFeedSignal };
