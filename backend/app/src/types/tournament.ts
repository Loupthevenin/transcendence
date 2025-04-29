import { TournamentTree } from "../tournament/tournamentTree";
import { Player } from "../types/player";

export type TournamentSettings = {
  maxPlayerCount: 4 | 8 | 16 | 32; // The maximum number of players in the tournament
  scoreToWin: number; // The score to win a match
}

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
