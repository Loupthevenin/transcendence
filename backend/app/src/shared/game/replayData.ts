export type Vector2 = [number, number];
export type PositionData = [Vector2, Vector2, Vector2];
export type ScoreData = Vector2;

export type RawReplayData = {
  gameDuration: number;
  p1Skin: string;
  p2Skin: string;
  positionData: [number, PositionData][];
  scoreData: [number, ScoreData][];
}

export function isRawReplayData(data: any): data is RawReplayData {
  return (
    data &&
    typeof data.gameDuration === "number" &&
    typeof data.p1Skin === "string" &&
    typeof data.p2Skin === "string" &&
    typeof data.positionData === "object" &&
    typeof data.scoreData === "object"
  );
}

export type ReplayData = {
  gameDuration: number;
  p1Skin: string;
  p2Skin: string;
  positionData: Map<number, PositionData>;
  scoreData: Map<number, ScoreData>;
}

export function isReplayData(data: any): data is ReplayData {
  return (
    data &&
    typeof data.gameDuration === "number" &&
    typeof data.p1Skin === "string" &&
    typeof data.p2Skin === "string" &&
    data.positionData instanceof Map &&
    data.scoreData instanceof Map
  );
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

export function convertRawReplayData(raw: RawReplayData): ReplayData {
  return {
    gameDuration: raw.gameDuration,
    p1Skin: raw.p1Skin,
    p2Skin: raw.p2Skin,
    positionData: new Map<number, PositionData>(raw.positionData),
    scoreData: new Map<number, ScoreData>(raw.scoreData),
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
