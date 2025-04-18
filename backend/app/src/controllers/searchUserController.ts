import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";

export async function searchUserHandler(
  request: FastifyRequest<{ Querystring: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.query;
  
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) {
    return reply.status(400).send({ error: "Invalid user ID" });
  }

  const user = db.prepare(`
    SELECT id, name, avatar_url
    FROM users
    WHERE id = ?
  `).get(parsedId);

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  return reply.send(user);
}
