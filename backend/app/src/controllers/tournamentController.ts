import { FastifyRequest, FastifyReply } from "fastify";
import { getTournaments } from "../tournament/tournamentManager";
import { Tournament } from "../types/tournament";
import TournamentInfo from "../shared/tournament/tournamentInfo";

export async function tournamentsController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const uuid: string | undefined = request.user?.uuid;
  if (!uuid) {
    return reply.status(401).send({ error: "Invalid Token" });
  }
  const tournaments: Tournament[] = getTournaments();
  const result: TournamentInfo[] = tournaments.map((t: Tournament) => ({
    uuid: t.uuid,
    name: t.name,
    playerRegistered: t.playerCount,
    maxPlayers: t.settings.maxPlayerCount,
    status: t.isClosed ? "Ongoing" : "Pending",
    joined: t.players.some((p) => p.uuid === uuid),
  } as TournamentInfo));
  reply.status(200).send(result);
}
