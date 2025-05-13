import db from "../db/db";

export function isBlocked(blockerUuid: string, blockedUuid: string): boolean {
  const block = db.prepare(`
    SELECT 1 FROM blocked_users
    WHERE blocker_uuid = ? AND blocked_uuid = ?
  `).get(blockerUuid, blockedUuid);

  return !!block;
}
