import { rows, run } from "./db";

export type ActivityKind = "view" | "like" | "save" | "download";

export async function recordActivity(userId: number, artworkId: number, kind: ActivityKind, strength = 1) {
  await run(
    `INSERT INTO interactions (user_id, artwork_id, kind, strength, updated_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, artwork_id, kind) DO UPDATE SET strength=interactions.strength + ?, updated_at=CURRENT_TIMESTAMP`,
    userId, artworkId, kind, strength, strength,
  );
}

export async function notifyFollowers(artworkId: number, characterSlug: string, characterName: string, animeSlug: string, animeName: string) {
  const followers = await rows(
    `SELECT DISTINCT user_id FROM follows WHERE (kind='character' AND value=?) OR (kind='anime' AND value=?)`,
    characterSlug, animeSlug,
  );
  for (const follower of followers) {
    await run(
      `INSERT INTO notifications (user_id, artwork_id, title, body) VALUES (?,?,?,?)
       ON CONFLICT(user_id, artwork_id) DO NOTHING`,
      follower.user_id, artworkId, `New ${characterName} artwork`, `${animeName} · Just added to AniPins`,
    );
  }
}
