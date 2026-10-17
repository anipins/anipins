type CachedRequest = { promise: Promise<any>; expiresAt: number };

const CACHE_TTL_MS = 15_000;
const requests = new Map<string, CachedRequest>();

export function getAdminJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const cached = requests.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const promise = fetch(url, { credentials: "same-origin", ...init }).then(async response => {
    if (!response.ok) throw new Error(`Admin request failed (${response.status})`);
    return response.json() as Promise<T>;
  }).catch(error => {
    requests.delete(url);
    throw error;
  });

  requests.set(url, { promise, expiresAt: Date.now() + CACHE_TTL_MS });
  return promise;
}

const routeRequests: Record<string, string[]> = {
  "/admin": ["/api/admin/stats"],
  "/admin/manage": ["/api/admin/artworks?q=&sort=latest&filter=all&scope=public&page=0&limit=40"],
  "/admin/premium-manage": ["/api/admin/artworks?q=&sort=latest&filter=all&scope=premium&page=0&limit=40"],
  "/admin/users": ["/api/admin/users"],
  "/admin/analytics": ["/api/admin/artworks?sort=views", "/api/meta", "/api/admin/downloads"],
  "/admin/security": ["/api/admin/security"],
  "/admin/settings": ["/api/settings"],
};

export function prefetchAdminRoute(href: string) {
  const urls = routeRequests[href];
  if (!urls) return;
  void Promise.all(urls.map(url => getAdminJson(url))).catch(() => {});
}

export function invalidateAdminData(prefix: string) {
  for (const url of requests.keys()) if (url.startsWith(prefix)) requests.delete(url);
}
