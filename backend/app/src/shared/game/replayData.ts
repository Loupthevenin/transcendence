export type Vector2 = [number, number];
export type PositionData = [Vector2, Vector2, Vector2];
export type ScoreData = Vector2;

export type ReplayData = {
  gameDuration: number;
  p1Skin: string;
  p2Skin: string;
  positionData: Map<number, PositionData>;
  scoreData: Map<number, ScoreData>;
}

export function newReplayData(): ReplayData {
  return {
    gameDuration: 0,
    p1Skin: "",
    p2Skin: "",
    positionData: new Map<number, PositionData>(),
    scoreData: new Map<number, ScoreData>()
  };
}

// Get the position data of ReplayData at given time
export function getReplayDataAtTime(replayData: ReplayData, time: number): PositionData | undefined {
  const times: number[] =
      Array.from(replayData.positionData.keys())
      .sort((a: number, b: number) => a - b);

  const closestTime: number | undefined =
      times.find((t: number) => t === time) ??
      times.reverse().find((t: number) => t < time);

  return closestTime !== undefined ? replayData.positionData.get(closestTime) : undefined;
}

// Get the score data of ReplayData at given time
export function getScoreAtTime(replayData: ReplayData, time: number): ScoreData | undefined {
  const times: number[] =
      Array.from(replayData.scoreData.keys())
      .sort((a: number, b: number) => a - b);

  const closestTime: number | undefined =
      times.find((t: number) => t === time)
      ?? times.reverse().find((t: number) => t < time);

  return closestTime !== undefined ? replayData.scoreData.get(closestTime) : undefined;
}
