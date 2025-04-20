import { FastifyRequest, FastifyReply } from "fastify";
import { Statement } from "better-sqlite3";
import db from "../db/db";

export async function listUsers(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const stmt: Statement = db.prepare("SELECT * FROM users");
  const users: Array<Record<string, any>> = stmt.all() as Array<
    Record<string, any>
  >;
  return reply.send(users);
};

export async function listMatchHistory(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const stmt: Statement = db.prepare(`
    SELECT * FROM match_history ORDER BY date DESC
  `);

  const matchHistory: Array<Record<string, any>> = stmt.all() as Array<
    Record<string, any>
  >;

  return reply.send(matchHistory);
};
