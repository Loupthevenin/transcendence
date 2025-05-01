import { TournamentTree } from "../tournament/tournamentTree";
import { Player } from "../types/player";
import { TournamentSettings } from "../shared/tournament/tournamentSettings";
import { maxScoreToWin } from "../shared/game/constants";

export type Tournament = {
  readonly uuid: string;
  name: string;
  owner: Player; // The player who created the tournament
  playerCount: number;
  players: Player[];
  settings: TournamentSettings;
  tree: TournamentTree;
  isClosed: boolean; // Indicates if the tournament is closed for new players
}

export function isValidTournamentSettings(settings: TournamentSettings): boolean {
  if (settings.maxPlayerCount !== 4 &&
      settings.maxPlayerCount !== 8 &&
      settings.maxPlayerCount !== 16 &&
      settings.maxPlayerCount !== 32) {
    return false;
  }

  if (settings.scoreToWin < 1 || settings.scoreToWin > maxScoreToWin) {
    return false;
  }

  return true;
}
