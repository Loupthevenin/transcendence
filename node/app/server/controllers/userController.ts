import { FastifyRequest, FastifyReply } from 'fastify';
import db from '../db/db';

export const listUsers = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const stmt = db.prepare("SELECT * FROM users");
  const users: Array<Record<string, any>> = stmt.all() as Array<Record<string, any>>;

  return reply.send(users);
};

export const addUser = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const insert = db.prepare("INSERT INTO users (name) VALUES (?)") ;
  const info = insert.run("Loup");

  const lastInsertRowid: number = Number(info.lastInsertRowid);

  return reply.send({ success: true, userId: lastInsertRowid });
};