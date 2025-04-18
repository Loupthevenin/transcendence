export interface MatchHistoryRow {
  id: number;
  player_a_name: string;
  player_b_name: string;
  player_a_uuid: string;
  player_b_uuid: string;
  score_a: number;
  score_b: number;
  mode: string;
  date: string;
}

export interface MatchHistory {
  date: string;
  mode: string;
  opponent: string;
  result: "win" | "lose";
  score: string;
}
