export type TournamentSettings = {
  maxPlayerCount: 4 | 8 | 16 | 32; // The maximum number of players in the tournament
  scoreToWin: number; // The score to win a match
}

export function isTournamentSettings(data: any): data is TournamentSettings {
  return (
    data &&
    typeof data.maxPlayerCount === "number" &&
    typeof data.scoreToWin === "number"
  );
}
