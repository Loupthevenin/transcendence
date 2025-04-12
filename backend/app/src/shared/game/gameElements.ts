import { WebSocket } from 'ws';
import * as BABYLON from "babylonjs";
import * as GAME_CONSTANT from "./constants";
import { Ball } from "./ball";
import { Room } from "./room";

export { BABYLON, GAME_CONSTANT };

export interface GameData {
  ball: Ball;
  paddle1Position: BABYLON.Vector2;
  paddle2Position: BABYLON.Vector2;
  p1Score: number;
  p2Score: number;
}

export function newGameData() : GameData {
  return {
      ball: {
        position: new BABYLON.Vector2(0, 0),
        velocity: new BABYLON.Vector2(0, 0)
      },
      paddle1Position: new BABYLON.Vector2(0, GAME_CONSTANT.paddleDefaultYPosition),
      paddle2Position: new BABYLON.Vector2(0, -GAME_CONSTANT.paddleDefaultYPosition),
      p1Score: 0,
      p2Score: 0,
    };
}

export interface Player {
  id: string;
  username: string;
  socket: WebSocket;
  room: Room | null;
}

export interface PaddleData {
  position: BABYLON.Vector2;
}
