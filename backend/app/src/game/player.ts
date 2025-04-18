import { WebSocket } from "ws";
import { Room } from "./room";

export type Player = {
  id: string;
  email: string;
  username: string;
  socket: WebSocket;
  room: Room | null;
  paddleSkinId: string;
}
