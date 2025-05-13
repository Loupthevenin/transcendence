import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";
import { MatchHistoryRow } from "../types/profileTypes";
import { MatchHistory } from "../shared/match/matchHistory";
import UserPublicProfile from "../shared/userPublicProfile";
import { getPlayerByUUID } from "../ws/setupWebSocket";
import { Player } from "../types/player";

type DbUserRow = {
  id: number;
  uuid: string;
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
    .prepare("SELECT id, uuid, name, avatar_url FROM users WHERE id = ?")
    .get(id) as DbUserRow | undefined;

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  const player: Player | undefined = getPlayerByUUID(user.uuid);

  const publicProfile: UserPublicProfile = {
    id: user.id,
    uuid: user.uuid,
    name: user.name,
    avatarUrl: user.avatar_url,
    isOnline: player !== undefined,
    isPlaying: !!(player?.room),
  };

  return reply.send(publicProfile);
}

export async function getHistory( request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
  const myUuid: string | undefined = request.user?.uuid;
  if (!myUuid) {
    return reply.status(401).send({ message: "Invalid Token" });
  }

  const userId: number = parseInt(request.params.id, 10);
  if (isNaN(userId)) {
    return reply.status(400).send({ message: "Invalid user ID" });
  }

  type UserUuidRow = { uuid: string };
  const user = db.prepare("SELECT uuid FROM users WHERE id = ?").get(userId) as UserUuidRow | undefined;
  if (!user?.uuid) {
    return reply.status(404).send({ message: "Utilisateur introuvable" });
  }

  const targetUuid: string = user.uuid;

  const matches: MatchHistoryRow[] = db.prepare(
    `SELECT * FROM match_history WHERE player_a_uuid = ? OR player_b_uuid = ? ORDER BY date DESC`
  ).all(targetUuid, targetUuid) as MatchHistoryRow[];

  const history: MatchHistory[] = matches.map((match: MatchHistoryRow) => {
    const isPlayerA: boolean = match.player_a_uuid === targetUuid;
    const myScore: number = isPlayerA ? match.score_a : match.score_b;
    const opponentScore: number = isPlayerA ? match.score_b : match.score_a;
    const opponentName: string = isPlayerA ? match.player_b_name : match.player_a_name;

    return {
      uuid: match.uuid,
      date: match.date,
      mode: match.mode,
      opponent: opponentName,
      result: match.winner === "draw"
        ? "draw"
        : match.winner === (isPlayerA ? "A" : "B")
        ? "win"
        : "lose",
      score: `${myScore} - ${opponentScore}`,
    } as MatchHistory;
  });

  return reply.send(history);
}
