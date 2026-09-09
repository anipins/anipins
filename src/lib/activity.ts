import { rows, run } from "./db";
import { sendPush } from "./push";

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
    `SELECT DISTINCT f.user_id FROM follows f JOIN users u ON u.id=f.user_id
     WHERE u.notify_following=1 AND ((f.kind='character' AND f.value=?) OR (f.kind='anime' AND f.value=?))`,
    characterSlug, animeSlug,
  );
  for (const follower of followers) {
    await run(
      `INSERT INTO notifications (user_id, artwork_id, title, body) VALUES (?,?,?,?)
       ON CONFLICT(user_id, artwork_id) DO NOTHING`,
      follower.user_id, artworkId, `New ${characterName} artwork`, `${animeName} · Just added to AniPins`,
    );
  }
  const devices = followers.length ? await rows(
    `SELECT DISTINCT p.token FROM push_devices p JOIN users u ON u.id=p.user_id
     WHERE u.notify_following=1 AND p.user_id IN (${followers.map(() => "?").join(",")})`,
    ...followers.map((f: any) => f.user_id),
  ) : [];
  await sendPush(devices.map((d: any) => d.token), `New ${characterName} artwork`, `${animeName} · Just added to AniPins`, `/a/${artworkId}`).catch(() => {});
}
