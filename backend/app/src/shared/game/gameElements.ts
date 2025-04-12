import { WebSocket } from 'ws';
import * as BABYLON from "babylonjs";
export * as GAME_CONSTANT from "./constants";
import { Ball } from "./ball";
import { Room } from "./room";

export { BABYLON };

export interface GameData {
  ball: Ball;
  paddle1Position: BABYLON.Vector2;
  paddle2Position: BABYLON.Vector2;
  p1Score: number;
  p2Score: number;
}

export interface Player {
  id: string;
  username: string;
  socket: WebSocket;
  room: Room | null;
}

export interface PlayerPaddle {
  position: BABYLON.Vector2;
}
