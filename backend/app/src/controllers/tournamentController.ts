import { FastifyRequest, FastifyReply } from "fastify";
import { getTournaments } from "../tournament/tournamentManager";
import { Tournament } from "../types/tournament";

export async function tournamentsController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const uuid: string | undefined = request.user?.uuid;
  if (!uuid) {
    return reply.status(401).send({ error: "Invalid Token" });
  }
  const tournaments: Tournament[] = getTournaments();
  const result = tournaments.map((t) => ({
    uuid: t.uuid,
    name: t.name,
    playerRegistered: t.playerCount,
    maxPlayers: t.settings.maxPlayerCount,
    status: t.isClosed ? "Ongoing" : "Pending",
    joined: t.players.some((p) => p.uuid === uuid),
  }));
  reply.status(200).send(result);
}
