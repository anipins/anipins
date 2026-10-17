export type MediaCleanupItem = { key: string; premium: boolean };

type MediaCleanupDependencies = {
  isReferenced: (item: MediaCleanupItem) => Promise<boolean>;
  deleteObject: (item: MediaCleanupItem) => Promise<void>;
  removeFromQueue: (item: MediaCleanupItem) => Promise<void>;
};

/**
 * Drain a durable media-cleanup queue. Referenced items are stale queue entries,
 * not cleanup candidates; failed object deletion stays queued for a later retry.
 */
export async function drainMediaCleanupQueue(
  items: MediaCleanupItem[],
  dependencies: MediaCleanupDependencies,
) {
  let deleted = 0;
  let pending = 0;
  let stillReferenced = 0;

  for (const item of items) {
    try {
      if (await dependencies.isReferenced(item)) {
        stillReferenced++;
        await dependencies.removeFromQueue(item);
        continue;
      }

      await dependencies.deleteObject(item);
      await dependencies.removeFromQueue(item);
      deleted++;
    } catch {
      pending++;
    }
  }

  return { deleted, pending, stillReferenced };
}
