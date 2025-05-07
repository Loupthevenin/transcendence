import { FastifyRequest, FastifyReply } from "fastify";
import { getTournaments, getTournament } from "../tournament/tournamentManager";
import { Tournament } from "../types/tournament";
import TournamentInfo from "../shared/tournament/tournamentInfo";
import { Player } from "../types/player";

export async function tournamentsController(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const uuid: string | undefined = request.user?.uuid;
  if (!uuid) {
    return reply.status(401).send({ error: "Invalid Token" });
  }
  const tournaments: Tournament[] = getTournaments();
  const result: TournamentInfo[] = tournaments.map(
    (t: Tournament) =>
      ({
        uuid: t.uuid,
        name: t.name,
        ownerUuid: t.owner.uuid,
        playerRegistered: t.playerCount,
        maxPlayers: t.settings.maxPlayerCount,
        status: t.isClosed ? "Ongoing" : "Pending",
        joined: t.players.some((p: Player) => p.uuid === uuid),
      }) as TournamentInfo,
  );
  reply.status(200).send(result);
}

export async function tournamentProgression(
  request: FastifyRequest<{ Querystring: { uuid: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const uuid: string = request.query.uuid;

  if (!uuid) {
    reply.status(400).send({ error: "UUID is required" });
    return;
  }

  const tournament: Tournament | undefined = getTournament(uuid);
  if (!tournament) {
    reply
      .status(404)
      .send({ error: `Tournament with UUID ${uuid} not found.` });
    return;
  }

  reply.status(200).send(tournament);
}
