const publicBrowseHeaders = { "Cache-Control": "public, max-age=5, s-maxage=10, stale-while-revalidate=45" };
const privateBrowseHeaders = { "Cache-Control": "private, no-store" };

export function artworkFeedCacheHeaders({ premiumOnly, sort }: { premiumOnly: boolean; sort: string }) {
  return !premiumOnly && sort !== "following" && sort !== "for-you" ? publicBrowseHeaders : privateBrowseHeaders;
}
