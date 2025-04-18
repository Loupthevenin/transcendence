import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";

export type UserPublicProfile = {
  id: number;
  name: string;
  avatarUrl: string;
};

type DbUserRow = {
  id: number;
  name: string;
  avatar_url: string;
};

export async function getPublicProfile(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const id = parseInt(request.params.id, 10);
  if (isNaN(id)) {
    return reply.status(400).send({ error: "Invalid user ID" });
  }

  const user = db
    .prepare("SELECT id, name, avatar_url FROM users WHERE id = ?")
    .get(id) as DbUserRow | undefined;

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  const publicProfile: UserPublicProfile = {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatar_url,
  };

  return reply.send(publicProfile);
}
