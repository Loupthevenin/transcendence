import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";

export async function searchUserHandler( request: FastifyRequest<{ Querystring: { id: string } }>, reply: FastifyReply) {
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

export async function searchUsers(request: FastifyRequest<{ Querystring: { query: string } }>, reply: FastifyReply) {
  const userEmail = request.user?.email;
  if (!userEmail) return reply.status(401).send({ error: "Unauthorized" });

  const { query } = request.query;
  if (!query) return reply.status(400).send({ error: "Missing query" });

  const currentUser = db.prepare("SELECT id FROM users WHERE email = ?").get(userEmail) as { id: number };

  let users: { id: number, name: string, avatar_url: string }[] = [];

  const isNumeric = /^\d+$/.test(query);

  if (isNumeric) {
    const user = db.prepare(`
      SELECT id, name, avatar_url
      FROM users
      WHERE id = ?
    `).get(Number(query)) as { id: number; name: string; avatar_url: string } | undefined;
    
    if (user) {
      users.push(user);
    }
    
  }

  const additionalUsers = db.prepare(`
    SELECT id, name, avatar_url
    FROM users
    WHERE name LIKE ?
      AND id != ?
    LIMIT 10
  `).all(`%${query}%`, currentUser.id) as { id: number, name: string, avatar_url: string }[];
  
  users = users.concat(additionalUsers);
  

  return reply.send(users);
}
