export interface MatchHistoryRow {
  id: number;
  uuid: string;
  player_a_name: string;
  player_b_name: string;
  player_a_uuid: string;
  player_b_uuid: string;
  score_a: number;
  score_b: number;
  winner: "A" | "B" | "draw";
  mode: string;
  date: string;
}
