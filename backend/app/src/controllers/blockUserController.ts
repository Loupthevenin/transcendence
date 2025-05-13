import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";

type BlockUserBody = {
  targetUserUuid: string;
};

export async function blockUser(
  request: FastifyRequest<{ Body: BlockUserBody }>,
  reply: FastifyReply
) {
  const blockerEmail = request.user?.email;
  if (!blockerEmail) {
    return reply.status(401).send({ error: "Invalid Token" });
  }

  const { targetUserUuid } = request.body;
  if (!targetUserUuid) {
    return reply.status(400).send({ error: "Missing targetUserUuid" });
  }

  const blocker = db
    .prepare(`SELECT uuid FROM users WHERE email = ?`)
    .get(blockerEmail) as { uuid: string } | undefined;

  if (!blocker) {
    return reply.status(404).send({ error: "Blocker user not found" });
  }

  if (blocker.uuid === targetUserUuid) {
    return reply.status(400).send({ error: "You cannot block yourself" });
  }

  try {
    db.prepare(`
      INSERT OR IGNORE INTO blocked_users (blocker_uuid, blocked_uuid)
      VALUES (?, ?)
    `).run(blocker.uuid, targetUserUuid);

    return reply.send({ success: true, message: "User blocked successfully" });
  } catch (err) {
    console.error("Error blocking user", err);
    return reply.status(500).send({ error: "Failed to block user" });
  }
}

export async function getBlockedUsers(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const blockerEmail = request.user?.email;
  if (!blockerEmail) {
    return reply.status(401).send({ error: "Invalid Token" });
  }

  const blocker = db
    .prepare(`SELECT uuid FROM users WHERE email = ?`)
    .get(blockerEmail) as { uuid: string } | undefined;

  if (!blocker) {
    return reply.status(404).send({ error: "Blocker user not found" });
  }

  const blockedUsers = db
    .prepare(`
      SELECT u.uuid, u.name, u.avatar_url
      FROM blocked_users bu
      JOIN users u ON bu.blocked_uuid = u.uuid
      WHERE bu.blocker_uuid = ?
    `)
    .all(blocker.uuid) as { uuid: string; name: string; avatar_url: string }[];

  return reply.send(
    blockedUsers.map((u) => ({
      uuid: u.uuid,
      name: u.name,
      avatar_url: u.avatar_url,
    }))
  );
}

export async function unblockUser(
  request: FastifyRequest<{ Body: BlockUserBody }>,
  reply: FastifyReply
) {
  const blockerEmail = request.user?.email;
  if (!blockerEmail) {
    return reply.status(401).send({ error: "Invalid Token" });
  }

  const { targetUserUuid } = request.body;
  if (!targetUserUuid) {
    return reply.status(400).send({ error: "Missing targetUserUuid" });
  }

  const blocker = db
    .prepare(`SELECT uuid FROM users WHERE email = ?`)
    .get(blockerEmail) as { uuid: string } | undefined;

  if (!blocker) {
    return reply.status(404).send({ error: "Blocker user not found" });
  }

  try {
    db.prepare(`
      DELETE FROM blocked_users
      WHERE blocker_uuid = ? AND blocked_uuid = ?
    `).run(blocker.uuid, targetUserUuid);

    return reply.send({ success: true, message: "User unblocked successfully" });
  } catch (err) {
    console.error("Error unblocking user", err);
    return reply.status(500).send({ error: "Failed to unblock user" });
  }
}

export async function isUserBlocked(
  request: FastifyRequest<{ Querystring: { targetUserUuid: string } }>,
  reply: FastifyReply
) {
  const blockerEmail = request.user?.email;
  if (!blockerEmail) {
    return reply.status(401).send({ error: "Invalid Token" });
  }

  const targetUserUuid = request.query.targetUserUuid;
  if (!targetUserUuid) {
    return reply.status(400).send({ error: "Invalid targetUserUuid" });
  }

  const blocker = db
    .prepare(`SELECT uuid FROM users WHERE email = ?`)
    .get(blockerEmail) as { uuid: string } | undefined;

  if (!blocker) {
    return reply.status(404).send({ error: "Blocker user not found" });
  }

  const block = db
    .prepare(`
      SELECT 1 FROM blocked_users
      WHERE (blocker_uuid = ? AND blocked_uuid = ?)
         OR (blocker_uuid = ? AND blocked_uuid = ?)
    `)
    .get(blocker.uuid, targetUserUuid, targetUserUuid, blocker.uuid);

  return reply.send({ blocked: !!block });
}
