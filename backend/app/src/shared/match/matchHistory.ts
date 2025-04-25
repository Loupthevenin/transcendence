export interface MatchHistory {
  uuid: string;
  date: string;
  mode: string;
  opponent: string;
  result: "win" | "lose" | "draw";
  score: string;
}