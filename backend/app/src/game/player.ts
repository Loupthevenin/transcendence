import { WebSocket } from "ws";
import { Room } from "./room";

export type Player = {
  uuid: string;
  username: string;
  socket: WebSocket | null;
  room: Room | null;
  paddleSkinId: string;
}
