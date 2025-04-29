import { WebSocket } from "ws";
import { Room } from "../game/room";

export type Player = {
  readonly uuid: string;
  readonly isBot: boolean;
  username: string;
  socket: WebSocket | null;
  room: Room | null;
  paddleSkinId: string;
}

export type DisconnectedPlayer = {
  disconnectionTime: number; // The time when the player was disconnected
  player: Player;
}
