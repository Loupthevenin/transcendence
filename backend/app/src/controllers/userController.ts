import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";

export const listUsers = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const stmt = db.prepare("SELECT * FROM users");
  const users: Array<Record<string, any>> = stmt.all() as Array<Record<string, any>>;
  return reply.send(users);
};

