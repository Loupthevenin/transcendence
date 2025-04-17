import { isVector2, GameData, isGameData } from "./gameElements";

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

export interface PaddlePositionMessage {
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

export interface GameDataMessage {
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

export interface GameStartedMessage {
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
  winner: 1 | 2; // The winner's index in the room
};

export function isGameResultMessage(data: any): data is GameResultMessage {
  return (
    data &&
    data.type === "gameResult" &&
    (data.winner === 1 || data.winner === 2)
  );
}

export type DisconnectionMessage = {
  readonly type: "disconnection";
  //id: 1 | 2; // The player's index in the room of the disconnected player
};

export function isDisconnectionMessage(data: any): data is DisconnectionMessage {
  return (
    data &&
    data.type === "disconnection"
    //&& (data.id === 1 || data.id === 2)
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
