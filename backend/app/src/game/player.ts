import { WebSocket } from "ws";
import { Room } from "./room";

export interface Player {
  id: string;
  email: string;
  username: string;
  socket: WebSocket;
  room: Room | null;
  paddleSkinId: string;
}
