import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";

export async function searchUserHandler(
  request: FastifyRequest<{ Querystring: { uuid: string } }>,
  reply: FastifyReply
) {
  const { uuid } = request.query;

  if (!uuid || typeof uuid !== "string") {
    return reply.status(400).send({ error: "Invalid user UUID" });
  }

  const user = db.prepare(`
    SELECT uuid, name, avatar_url
    FROM users
    WHERE uuid = ?
  `).get(uuid) as { uuid: string; name: string; avatar_url: string } | undefined;

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  return reply.send(user);
}

export async function searchUsers(
  request: FastifyRequest<{ Querystring: { query: string } }>,
  reply: FastifyReply
) {
  const userEmail = request.user?.email;
  if (!userEmail) return reply.status(401).send({ error: "Unauthorized" });

  const { query } = request.query;
  if (!query) return reply.status(400).send({ error: "Missing query" });

  const currentUser = db.prepare(`
    SELECT uuid FROM users WHERE email = ?
  `).get(userEmail) as { uuid: string };

  let users: { uuid: string; name: string; avatar_url: string }[] = [];

  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(query);

  if (isValidUuid) {
    const user = db.prepare(`
      SELECT uuid, name, avatar_url
      FROM users
      WHERE uuid = ?
    `).get(query) as { uuid: string; name: string; avatar_url: string } | undefined;

    if (user && user.uuid !== currentUser.uuid) {
      users.push(user);
    }
  }

  const additionalUsers = db.prepare(`
    SELECT uuid, name, avatar_url
    FROM users
    WHERE name LIKE ?
      AND uuid != ?
    LIMIT 10
  `).all(`%${query}%`, currentUser.uuid) as { uuid: string; name: string; avatar_url: string }[];

  users = users.concat(additionalUsers);

  return reply.send(users);
}
