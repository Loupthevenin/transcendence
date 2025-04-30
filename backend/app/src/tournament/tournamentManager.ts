//import db from "../db/db";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../types/player";
import { Tournament, TournamentSettings } from "../types/tournament";
import { TournamentTree } from "./tournamentTree";
import { getRandomPaddleModelId } from "../controllers/assetsController";

const tournaments: Map<string, Tournament> = new Map();

// This function creates a new tournament, adds it to the tournaments map and returns it
// It checks if the owner has already created a tournament, and if so, it returns null
export function createNewTournament(
  name: string,
  owner: Player,
  settings: TournamentSettings
): Tournament | null {
  // Search if the owner has already created a tournament
  const ownerTournament: Tournament | undefined = Array.from(tournaments.values()).find(
    (tournament: Tournament) => tournament.owner.uuid === owner.uuid
  );
  if (ownerTournament) {
    return null; // If a tournament already exists for this owner, return null
  }

  const uuid: string = uuidv4();
  const tournament: Tournament = {
    uuid,
    name,
    owner,
    playerCount: 0,
    players: [],
    settings,
    tree: new TournamentTree(settings.scoreToWin),
    isClosed: false
  };

  tournaments.set(uuid, tournament);
  return tournament;
}

// Getter for tournaments
export function getTournament(uuid: string): Tournament | undefined {
  return tournaments.get(uuid);
}

// Add a player to a tournament
export function addPlayerToTournament(
  tournamentUUID: string,
  player: Player
): boolean {
  const tournament: Tournament | undefined = tournaments.get(tournamentUUID);
  if (!tournament) {
    return false;
  }

  if (tournament.isClosed) {
    return false; // Tournament is closed, cannot join
  }

  if (tournament.players.length >= tournament.settings.maxPlayerCount) {
    return false; // Tournament is full
  }

  if (tournament.players.find((p: Player) => p.uuid === player.uuid)) {
    return false; // Player is already in the tournament
  }

  tournament.players.push(player);
  tournament.playerCount++;
  return true;
}

// Remove a player from a tournament
export function removePlayerFromTournament(
  tournamentUUID: string,
  player: Player
): boolean {
  const tournament: Tournament | undefined = tournaments.get(tournamentUUID);
  if (!tournament) {
    return false;
  }

  if (tournament.isClosed) {
    return false; // Tournament is closed, cannot quit
  }

  const playerIndex: number = tournament.players.findIndex(
    (p: Player) => p.uuid === player.uuid
  );
  if (playerIndex === -1) {
    return false; // Player not found in the tournament
  }

  tournament.players.splice(playerIndex, 1);
  tournament.playerCount--;
  return true;
}

// Adjust players to make the count a power of 2 by adding bot players
function adjustPlayers(players: Player[]): void {
  let count: number = players.length;
  // Calculate the next power of 2
  // If the count is less or equal than 4, set it to 4 (minimum for a tournament)
  const nextPowerOfTwo: number = count <= 4 ? 4 : Math.pow(2, Math.ceil(Math.log2(count)));

  let botCount: number = 1;

  while (count < nextPowerOfTwo) {
    players.push({
      uuid: uuidv4(),
      isBot: true,
      username: `Bot ${botCount++}`,
      socket: null,
      room: null,
      paddleSkinId: getRandomPaddleModelId()
    });
    count++;
  }
}

// Close a tournament for new players
export function closeTournament(
  tournamentUUID: string,
  player: Player
): boolean {
  const tournament: Tournament | undefined = tournaments.get(tournamentUUID);
  if (!tournament) {
    return false;
  }

  if (tournament.isClosed) {
    return false; // Tournament is already closed
  }

  if (tournament.owner.uuid !== player.uuid) {
    return false; // Only the owner can close the tournament
  }

  if (tournament.players.length < 3) {
    return false; // Tournament must have at least 3 players to be closed
  }

  tournament.isClosed = true;

  // Ensure the number of players is a power of 2 by adding bot players if necessary
  adjustPlayers(tournament.players);
  tournament.playerCount = tournament.players.length;

  tournament.tree.generate(tournament.players);
  return true;
}