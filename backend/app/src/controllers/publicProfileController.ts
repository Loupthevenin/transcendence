import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";
import { MatchHistoryRow } from "../types/profileTypes";
import { MatchHistory } from "../shared/match/matchHistory";
import UserPublicProfile from "../shared/userPublicProfile";
import { getPlayerByUUID } from "../ws/setupWebSocket";
import { Player } from "../types/player";


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

  const matches: MatchHistoryRow[] = db
    .prepare(`SELECT * FROM match_history WHERE player_a_uuid = ? OR player_b_uuid = ? ORDER BY date DESC`)
    .all(targetUuid, targetUuid) as MatchHistoryRow[];

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
      result:
        match.winner === "draw"
          ? "draw"
          : match.winner === (isPlayerA ? "A" : "B")
          ? "win"
          : "lose",
      score: `${myScore} - ${opponentScore}`,
    } as MatchHistory;
  });

  return reply.send(history);
}
