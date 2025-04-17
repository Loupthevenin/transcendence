import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";


type BlockUserBody = {
    targetUserId: number;
  };
  
export async function blockUser( request: FastifyRequest<{ Body: BlockUserBody }>, reply: FastifyReply) {
  const blockerEmail = request.user?.email;
  if (!blockerEmail) {
      return reply.status(401).send({ error: "Invalid Token" });
  }

  const { targetUserId } = request.body;
  if (!targetUserId) {
      return reply.status(400).send({ error: "Missing targetUserId" });
  }

  // Get the ID of the person blocking
  const blocker = db.prepare(`
      SELECT id FROM users WHERE email = ?
  `).get(blockerEmail) as { id: number } | undefined;

  if (!blocker) {
      return reply.status(404).send({ error: "Blocker user not found" });
  }

  if (blocker.id === targetUserId) {
      return reply.status(400).send({ error: "You cannot block yourself" });
  }

  // Insert into blocked_users table
  try {
      db.prepare(`
      INSERT OR IGNORE INTO blocked_users (blocker_id, blocked_id)
      VALUES (?, ?)
      `).run(blocker.id, targetUserId);

      return reply.send({ success: true, message: "User blocked successfully" });
  } catch (err) {
      console.error("Error blocking user", err);
      return reply.status(500).send({ error: "Failed to block user" });
  }
}

export async function getBlockedUsers( request: FastifyRequest, reply: FastifyReply) {
  const blockerEmail = request.user?.email;
  if (!blockerEmail) {
      return reply.status(401).send({ error: "Invalid Token" });
  }

  const blocker = db.prepare(`
      SELECT id FROM users WHERE email = ?
  `).get(blockerEmail) as { id: number } | undefined;

  if (!blocker) {
      return reply.status(404).send({ error: "Blocker user not found" });
  }

  const blockedUsers = db.prepare(`
      SELECT u.id, u.name, u.avatar_url
      FROM blocked_users bu
      JOIN users u ON bu.blocked_id = u.id
      WHERE bu.blocker_id = ?
  `).all(blocker.id) as { id: number; name: string; avatar_url: string }[];

  return reply.send(
      blockedUsers.map(u => ({
      id: u.id,
      name: u.name,
      avatar_url: u.avatar_url,
      }))
  );
}
  
export async function unblockUser( request: FastifyRequest<{ Body: BlockUserBody }>, reply: FastifyReply) {
  const blockerEmail = request.user?.email;
  if (!blockerEmail) {
    return reply.status(401).send({ error: "Invalid Token" });
  }

  const { targetUserId } = request.body;
  if (!targetUserId) {
    return reply.status(400).send({ error: "Missing targetUserId" });
  }

  const blocker = db.prepare(`
    SELECT id FROM users WHERE email = ?
  `).get(blockerEmail) as { id: number } | undefined;

  if (!blocker) {
    return reply.status(404).send({ error: "Blocker user not found" });
  }

  try {
    db.prepare(`
      DELETE FROM blocked_users
      WHERE blocker_id = ? AND blocked_id = ?
    `).run(blocker.id, targetUserId);

    return reply.send({ success: true, message: "User unblocked successfully" });
  } catch (err) {
    console.error("Error unblocking user", err);
    return reply.status(500).send({ error: "Failed to unblock user" });
  }
}
  

export async function isUserBlocked( request: FastifyRequest<{ Querystring: { targetUserId: string } }>, reply: FastifyReply) {
  const blockerEmail = request.user?.email;
  if (!blockerEmail) {
    return reply.status(401).send({ error: "Invalid Token" });
  }

  const targetUserId = parseInt(request.query.targetUserId, 10);
  if (isNaN(targetUserId)) {
    return reply.status(400).send({ error: "Invalid targetUserId" });
  }

  const blocker = db.prepare(`
    SELECT id FROM users WHERE email = ?
  `).get(blockerEmail) as { id: number } | undefined;

  if (!blocker) {
    return reply.status(404).send({ error: "Blocker user not found" });
  }

  const block = db.prepare(`
    SELECT id FROM blocked_users
    WHERE (blocker_id = ? AND blocked_id = ?)
        OR (blocker_id = ? AND blocked_id = ?)
  `).get(blocker.id, targetUserId, targetUserId, blocker.id) as { id: number } | undefined;

  return reply.send({ blocked: !!block });
}
  