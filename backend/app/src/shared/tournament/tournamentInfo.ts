export type TournamentInfo = {
  uuid: string;
  name: string;
  isOwner: boolean;
  playerRegistered: number;
  maxPlayers: number;
  status: "Pending" | "Ongoing" | "Ended";
  joined: boolean;
};

export type PlayerInfo = {
  uuid: string;
  username: string;
  isBot: boolean;
};

export type MatchNode = {
  winnerUUID: string;
  player1: PlayerInfo | null;
  player2: PlayerInfo | null;
  left: MatchNode | null;
  right: MatchNode | null;
};