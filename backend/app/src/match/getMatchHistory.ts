import db from "../db/db";
import { MatchHistory } from "../shared/match/matchHistory";
import { MatchHistoryRow } from "../types/profileTypes";

export function getMatchHistory(playerUuid: string): MatchHistory[] {
  const matches: MatchHistoryRow[] = db
    .prepare(`
      SELECT 
      mh.*, 
      ua.name AS player_a_name, 
      ub.name AS player_b_name
      FROM match_history mh
      JOIN users ua ON mh.player_a_uuid = ua.uuid
      JOIN users ub ON mh.player_b_uuid = ub.uuid
      WHERE mh.player_a_uuid = ? OR mh.player_b_uuid = ?
      ORDER BY mh.date DESC
    `)
    .all(playerUuid, playerUuid) as MatchHistoryRow[];

  return matches.map((match: MatchHistoryRow) => {
    const isPlayerA: boolean = match.player_a_uuid === playerUuid;

    const myScore: number = isPlayerA ? match.score_a : match.score_b;
    const opponentScore: number = isPlayerA ? match.score_b : match.score_a;
    const opponentName: string = isPlayerA ? match.player_b_name : match.player_a_name;

    const matchHistory: MatchHistory = {
      uuid: match.uuid,
      date: match.date,
      mode: match.mode,
      opponent: opponentName,
      result:
        match.winner === "draw"
          ? "draw"
          : match.winner === (isPlayerA ? "A" : "B")
            ? "win"
            : "lose",
      score: `${myScore} - ${opponentScore}`,
    };
    return matchHistory;
  });
}