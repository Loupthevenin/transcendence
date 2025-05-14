import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";
import UserPublicProfile from "../shared/userPublicProfile";
import { getPlayerByUUID } from "../ws/setupWebSocket";
import { Player } from "../types/player";
import { getMatchHistory } from "../match/getMatchHistory";


type DbUserRow = {
  uuid: string;
  name: string;
  avatar_url: string;
};

export async function getPublicProfile(
  request: FastifyRequest<{ Params: { uuid: string } }>,
  reply: FastifyReply
) {
  const { uuid } = request.params;
  if (!uuid || typeof uuid !== "string") {
    return reply.status(400).send({ error: "Invalid user UUID" });
  }

  const user = db
    .prepare("SELECT uuid, name, avatar_url FROM users WHERE uuid = ?")
    .get(uuid) as DbUserRow | undefined;

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  const player: Player | undefined = getPlayerByUUID(user.uuid);

  const publicProfile: UserPublicProfile = {
    uuid: user.uuid,
    name: user.name,
    avatarUrl: user.avatar_url,
    isOnline: player !== undefined,
    isPlaying: !!(player?.room),
  };

  return reply.send(publicProfile);
}

export async function getHistory(
  request: FastifyRequest<{ Params: { uuid: string } }>,
  reply: FastifyReply
): Promise<void> {
  const myUuid: string | undefined = request.user?.uuid;
  if (!myUuid) {
    return reply.status(401).send({ message: "Invalid Token" });
  }

  const targetUuid = request.params.uuid;
  if (!targetUuid || typeof targetUuid !== "string") {
    return reply.status(400).send({ message: "Invalid user UUID" });
  }

  const userExists = db.prepare("SELECT 1 FROM users WHERE uuid = ?").get(targetUuid);
  if (!userExists) {
    return reply.status(404).send({ message: "Utilisateur introuvable" });
  }

  return reply.send(getMatchHistory(targetUuid));
}
