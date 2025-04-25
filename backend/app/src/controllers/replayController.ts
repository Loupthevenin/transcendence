import { FastifyRequest, FastifyReply } from "fastify";
import path from "path";
import fs from "fs";
import { PositionData, ScoreData, RawReplayData, isRawReplayData, ReplayData } from "../shared/game/replayData";
import { GameData } from "../shared/game/gameElements"
import { DB_DIR } from "../config";

const saveDir: string = path.join(DB_DIR, "replays");

function convertVector2(vector: BABYLON.Vector2): [number, number] {
  return [vector.x, vector.y];
}

// Take a snapshot of the game data and save it in ReplayData at time
export function snapshotReplayData(replayData: ReplayData, time: number, gameData: GameData): void {
  const lastEntry: PositionData | undefined = replayData.positionData.get(
    Array.from(replayData.positionData.keys()).pop() ?? 0
  );
  const lastScoreEntry: ScoreData | undefined = replayData.scoreData.get(
    Array.from(replayData.scoreData.keys()).pop() ?? 0
  );

  const newPositions: PositionData = [
    convertVector2(gameData.ball.position),
    convertVector2(gameData.paddle1Position),
    convertVector2(gameData.paddle2Position)
  ];

  // Check if the difference between the last recorded positions
  // and the current positions are greater than 1e-6
  if (!lastEntry ||
      Math.abs(lastEntry[0][0] - newPositions[0][0]) > 1e-6 ||
      Math.abs(lastEntry[0][1] - newPositions[0][1]) > 1e-6 ||
      Math.abs(lastEntry[1][0] - newPositions[1][0]) > 1e-6 ||
      Math.abs(lastEntry[1][1] - newPositions[1][1]) > 1e-6 ||
      Math.abs(lastEntry[2][0] - newPositions[2][0]) > 1e-6 ||
      Math.abs(lastEntry[2][1] - newPositions[2][1]) > 1e-6) {
    replayData.positionData.set(time, newPositions);
  }

  // Check if the last saved scores are not equal to the current one
  const newScores: ScoreData = [gameData.p1Score, gameData.p2Score];

  if (!lastScoreEntry ||
      lastScoreEntry[0] !== newScores[0] ||
      lastScoreEntry[1] !== newScores[1]) {
    replayData.scoreData.set(time, newScores);
  }
}

// Save the ReplayData to filename
export function saveReplayDataToFile(replayData: ReplayData, filename: string): void {
  const jsonData: string = JSON.stringify({
    gameDuration: replayData.gameDuration,
    p1Skin: replayData.p1Skin,
    p2Skin: replayData.p2Skin,
    positionData: Array.from(replayData.positionData.entries()),
    scoreData: Array.from(replayData.scoreData.entries())
  },
  // function to set the number precision to a maximum of 3 digits
  (_, val: any) => {
    return val.toFixed ? Number(val.toFixed(3)) : val;
  });

  // Create the destination directory if not exist
  fs.mkdirSync(saveDir, { recursive: true });

  // Save the file
  const savePath: string = path.join(saveDir, `${filename}.replay`);
  fs.writeFileSync(savePath, jsonData, "utf-8");
}

// Load the ReplayData from filename
function loadRawReplayDataFromFile(filename: string): RawReplayData | null {
  const filePath: string = path.join(saveDir, `${filename}.replay`);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const jsonData: string = fs.readFileSync(filePath, "utf-8");
    const parsedData: any = JSON.parse(jsonData);

    // Check file content validity
    if (isRawReplayData(parsedData)) {
      return parsedData;
    }
    return null;
  } catch (error: any) {
    console.error(`Error loading replay data (${filePath}) : ${error}`);
    return null;
  }
}

export function getMatchIdData(request: FastifyRequest, reply: FastifyReply): void {
  if (!request.params || !(request.params as any).match_id) {
    reply.status(400).send({ error: "Empty request" });
    return;
  }

  try {
    const { match_id } = request.params as { match_id: string };

    const replayData: RawReplayData | null = loadRawReplayDataFromFile(match_id);

    if (!replayData) {
      reply.status(404).send({ error: "Match not found" });
      return;
    }

    reply.send(JSON.stringify(replayData));
  } catch (error: any) {
    reply.status(500).send({ error: "Internal server error" });
  }
}