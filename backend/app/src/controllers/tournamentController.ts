import { FastifyRequest, FastifyReply } from "fastify";
import { getTournaments, getTournament } from "../tournament/tournamentManager";
import { Tournament } from "../types/tournament";
import { MatchNode } from "../tournament/tournamentTree";
import { Player } from "../types/player";
import { TournamentInfo, PlayerInfo, MatchNode as MatchNodeInfo } from "../shared/tournament/tournamentInfo";

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
        isOwner: t.owner.uuid === uuid,
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

  try {
    const tree: MatchNodeInfo | null = convertMatchNode(tournament.tree.root, tournament.pseudoNames);
    reply.status(200).send(tree);
  } catch (error: any) {
    reply.status(500).send({ error: "Internal server error" });
  }
}

// Helper to convert a Player to PlayerInfo
function convertPlayer(player: Player, pseudoNames: Map<string, string>): PlayerInfo {
  return {
    uuid: player.uuid,
    username: pseudoNames.get(player.uuid) ?? player.username,
    isBot: player.isBot,
  };
}

// Recursive converter function from MatchNode1 to MatchNodeInfo.
function convertMatchNode(node: MatchNode | null, pseudoNames: Map<string, string>): MatchNodeInfo | null {
  if (node === null) {
    return null;
  }

  // Recursively convert children nodes.
  const leftConverted: MatchNodeInfo | null = convertMatchNode(node.left, pseudoNames);
  const rightConverted: MatchNodeInfo | null = convertMatchNode(node.right, pseudoNames);

  // For the match, the winner is the player on the current node.
  // And the match participants are taken from the children node's player.
  const converted: MatchNodeInfo = {
    winnerUUID: node.player ? node.player.uuid : "",

    // Extract player1 from the left child. If there is one assigned to the left match, convert it.
    player1: node.left && node.left.player 
      ? convertPlayer(node.left.player, pseudoNames)
      : null,

    // Similarly for player2 from the right child.
    player2: node.right && node.right.player 
      ? convertPlayer(node.right.player, pseudoNames)
      : null,

    left: leftConverted,
    right: rightConverted,
  };

  return converted;
}