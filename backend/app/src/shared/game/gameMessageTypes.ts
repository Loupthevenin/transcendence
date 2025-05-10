import { isVector2, GameData, isGameData, GameStats, isGameStats } from "./gameElements";

export type SkinChangeMessage = {
  readonly type: "skinId";
  id: 1 | 2; // The player's index in the room
  skinId: string; // The player's paddle skin ID
};

export function isSkinChangeMessage(data: any): data is SkinChangeMessage {
  return (
    data &&
    data.type === "skinId" &&
    (data.id === 1 || data.id === 2) &&
    typeof data.skinId === "string"
  );
}

export type PaddlePositionMessage = {
  readonly type: "paddlePosition";
  position: BABYLON.Vector2; // The new position of the paddle
}

export function isPaddlePositionMessage(data: any): data is PaddlePositionMessage {
  return (
    data &&
    data.type === "paddlePosition" &&
    isVector2(data.position)
  );
}

export type GameDataMessage = {
  readonly type: "gameData";
  data: GameData; // The game data
}

export function isGameDataMessage(data: any): data is GameDataMessage {
  return (
    data &&
    data.type === "gameData" &&
    typeof data.data === "object" &&
    isGameData(data.data)
  );
}

export type GameStartedMessage = {
  readonly type: "gameStarted";
  id: 1 | 2; // The player's index in the room to know which paddle to control
}

export function isGameStartedMessage(data: any): data is GameStartedMessage {
  return (
    data &&
    data.type === "gameStarted" &&
    (data.id === 1 || data.id === 2)
  );
}

export type GameResultMessage = {
  readonly type: "gameResult";
  p1Score: number; // The score of the player 1
  p2Score: number; // The score of the player 2
  winner: string; // The winner's nickname
  gameStats: GameStats; // Stats about the game
};

export function isGameResultMessage(data: any): data is GameResultMessage {
  return (
    data &&
    data.type === "gameResult" &&
    typeof data.p1Score === "number" &&
    typeof data.p2Score === "number" &&
    typeof data.winner === "string" &&
    typeof data.gameStats === "object" &&
    isGameStats(data.gameStats)
  );
}

export type DisconnectionMessage = {
  readonly type: "disconnection";
  id: 1 | 2; // The player's index in the room of the disconnected player
};

export function isDisconnectionMessage(data: any): data is DisconnectionMessage {
  return (
    data &&
    data.type === "disconnection" &&
    (data.id === 1 || data.id === 2)
  );
}

export type ReconnectionMessage = {
  readonly type: "reconnection";
  id: 1 | 2; // The player's index in the room to know which paddle to control
  selfSkinId: string; // The player paddle skin ID
  otherSkinId: string; // The other player paddle skin ID
};

export function isReconnectionMessage(data: any): data is ReconnectionMessage {
  return (
    data &&
    data.type === "reconnection" &&
    (data.id === 1 || data.id === 2) &&
    typeof data.selfSkinId === "string" &&
    typeof data.otherSkinId === "string"
  );
}

export type MatchmakingMessage = {
  readonly type: "matchmaking";
  username: string; // The player username
};

export function isMatchmakingMessage(data: any): data is MatchmakingMessage {
  return (
    data &&
    data.type === "matchmaking" &&
    typeof data.username === "string"
  );
}

export type LeaveGameMessage = {
  readonly type: "leaveGame";
};

export function isLeaveGameMessage(data: any): data is LeaveGameMessage {
  return (
    data &&
    data.type === "leaveGame"
  );
}

export type ReadyToPlayMessage = {
  readonly type: "readyToPlay";
  opponentId: string;
};

export function isReadyToPlayMessage(data: any): data is ReadyToPlayMessage {
  return (
    data &&
    data.type === "readyToPlay" &&
    typeof data.opponentId === "string"
  );
}
