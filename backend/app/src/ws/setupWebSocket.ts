import WebSocket, { WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { Player } from "../game/player";
import { Room } from "../game/room";
import { scoreToWin } from "../shared/game/constants";
import { SkinChangeMessage, isSkinChangeMessage, isPaddlePositionMessage, isMatchmakingMessage } from "../shared/game/gameMessageTypes";
import { ErrorMessage, GameMessageData, isGameMessage } from "../shared/messageType";
import ERROR_TYPE from "../shared/errorType";
import { JWT_SECRET } from "../config";
import { UserPayload } from "../types/UserPayload";
import { User } from "../types/authTypes";
import db from "../db/db";

// email : Player
const players: Map<string, Player> = new Map();

const rooms: Map<string, Room> = new Map();
let roomCounter: number = 1;

function addPlayerToRoom(player: Player): Room {
  // Check for an available room
  for (const [, room] of rooms) {
      if (!room.isFull() && !room.gameLaunched && !room.gameEnded) {
          if (room.addPlayer(player)) {
              return room;
          }
      }
  }

  // If no available room, create a new room
  const newRoomId: string = `room-${roomCounter++}`;
  const newRoom: Room = new Room(newRoomId);
  newRoom.addPlayer(player);

  rooms.set(newRoomId, newRoom);

  return newRoom;
}

// Extract the params from the request
function extractUrlParams(request: IncomingMessage): { [key: string]: string } {
  const fullUrl: string = `${request.headers.origin}${request.url}`;
  const parsedUrl: URL = new URL(fullUrl);

  const params: { [key: string]: string } = {};
  for (const [key, value] of parsedUrl.searchParams.entries()) {
    params[key] = value;
  }

  return params;
};

export function getPlayersByEmail(email: string): Player | null {
  const target: Player | undefined = players.get(email);
  return target ? target : null;
}

// WebSocket setup
export function setupWebSocket(): WebSocketServer {
  const wss: WebSocketServer = new WebSocket.Server({ noServer: true });

  // WebSocket connection
  wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
    let isAuthentificated: boolean = false;
    const params: { [key: string]: string; } = extractUrlParams(request);

    let playerEmail: string = "";
    let playerUsername: string = "";

    const token: string = params.token;
    if (token) {
      try {
        const decoded: UserPayload = jwt.verify(token, JWT_SECRET) as UserPayload;
        if (decoded && decoded.email && typeof decoded.email === "string") {
          console.log(`User connected: ${decoded.email}`);

          const user: User = db
            .prepare("SELECT * FROM users WHERE email = ?")
            .get(decoded.email) as User;

          if (user) {
            isAuthentificated = true;
            playerEmail = user.email;
            playerUsername = user.name;
          }
        }
      } catch (error) {
      }
    }

    // If there is no token or the token is invalid, refuse the connection
    if (!isAuthentificated || !playerEmail || !playerUsername) {
      const errorMsg: ErrorMessage = { type: "error", msg: "Token is missing or invalid", errorType: ERROR_TYPE.CONNECTION_REFUSED };
      ws.send(JSON.stringify(errorMsg));
      ws.close(); // Close the connection after sending the error message
      return;
    }

    // Check if there player is already connected with this account
    if (getPlayersByEmail(playerEmail) !== null) {
      const errorMsg: ErrorMessage = { type: "error", msg: "Already connected", errorType: ERROR_TYPE.CONNECTION_REFUSED };
      ws.send(JSON.stringify(errorMsg));
      ws.close(); // Close the connection after sending the error message
      return;
    }

    const playerId: string = uuidv4();

    const player: Player = {
      id: playerId,
      email: playerEmail,
      username: playerUsername,
      socket: ws,
      room: null,
      paddleSkinId: ""
    };

    players.set(playerEmail, player);
    console.log(`New player connected: ${player.username} (${playerEmail})`);

    ws.on("message", (message: string) => {
      //console.log("Received data:", JSON.parse(message));

      try {
        const msgData: any = JSON.parse(message);

        if (!isGameMessage(msgData)) {
          return;
        }
        const data: GameMessageData = msgData.data;

        if (isMatchmakingMessage(data)) {
          console.log(`[Matchmaking] : ${player.username} (${playerEmail})`);
          const room: Room = addPlayerToRoom(player);

          // Start the game if room is full
          if (room.isFull()) {
            room.startGame().then(() => {
              console.log(`Game ended in room '${room.id}' with winner ${room.gameData.p1Score >= scoreToWin ? 1 : 2}`);
            }).catch((error) => {
              console.error(`Error starting game in room '${room.id}':`, error);
            }).finally(() => {
              rooms.delete(room.id);
            });
          }
        }
        else if (isSkinChangeMessage(data)) {
          if (player.room) {
            // Check if the player who send the message is the owner of the paddle
            if (data.id === player.room.indexOfPlayer(player)) {
              player.paddleSkinId = data.skinId;
              if (player.room.gameLaunched) {
                const skinChangeMessage: SkinChangeMessage = {
                  type: "skinId",
                  id: data.id,
                  skinId: player.paddleSkinId
                }
                player.room.sendMessage(skinChangeMessage, [playerId]);
              }
            }
          }
        }
        else if (isPaddlePositionMessage(data)) {
          if (player.room) {
            // Update paddle positions
            if (player.room.player1?.id === playerId) {
              player.room.gameData.paddle1Position = data.position;
            } else if (player.room.player2?.id === playerId) {
              player.room.gameData.paddle2Position = data.position;
            }
          }
        }
      }
      catch (error) {
        console.error("An Error occured:", error);
      }
    });

    const pingInterval: NodeJS.Timeout = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
      }
    }, 30000);

    ws.on("close", () => {
      clearInterval(pingInterval); // Clear ping interval on disconnect
      player.room?.removePlayer(player);
      players.delete(playerEmail);
      console.log(`Player disconnected: ${player.username} (${playerEmail})`);
    });
  });

  return wss;
}
