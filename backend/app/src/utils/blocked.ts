import db from "../db/db";

/**
 * Vérifie si un utilisateur a bloqué un autre.
 * @param blockerId - L'ID de celui qui pourrait avoir bloqué
 * @param blockedId - L'ID de celui qui est potentiellement bloqué
 * @returns true si block existe, false sinon
 */
export function isBlocked(blockerId: number, blockedId: number): boolean {
  const block = db.prepare(`
    SELECT id FROM blocked_users
    WHERE blocker_id = ? AND blocked_id = ?
  `).get(blockerId, blockedId) as { id: number } | undefined;

  return !!block;
}
