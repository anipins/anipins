/** Never infer a successful save from a successful network call alone. */
async function requestArtworkSave(artworkId, collectionId, fetcher = fetch) {
  try {
    const response = await fetcher("/api/saves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artworkId, collectionId }),
    });
    if (response.status === 401) return { status: "unauthorized" };
    if (!response.ok) return { status: "error" };
    const data = await response.json();
    return data?.ok === true && data?.saved === true ? { status: "saved" } : { status: "error" };
  } catch {
    return { status: "error" };
  }
}

module.exports = { requestArtworkSave };
