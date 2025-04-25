import WebSocket, { WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import jwt from "jsonwebtoken";
import { Player } from "../game/player";
import { addPlayerToMatchmaking } from "../game/room";
import {
  isSkinChangeMessage,
  isPaddlePositionMessage,
  isMatchmakingMessage,
} from "../shared/game/gameMessageTypes";
import {
  ErrorMessage,
  GameMessageData,
  isGameMessage,
} from "../shared/messageType";
import ERROR_TYPE, { ERROR_MSG } from "../shared/errorType";
import { JWT_SECRET } from "../config";
import { UserPayload } from "../types/UserPayload";
import { User } from "../types/authTypes";
import db from "../db/db";

type DisconnectedPlayer = {
  disconnectionTime: number;
  player: Player;
}

// key = uuid
const players: Map<string, Player> = new Map();
const recentlyDisconnectedPlayers: Map<string, DisconnectedPlayer> = new Map();

// Extract the params from the request
function extractUrlParams(request: IncomingMessage): { [key: string]: string } {
  const fullUrl: string = `${request.headers.origin}${request.url}`;
  const parsedUrl: URL = new URL(fullUrl);

  const params: { [key: string]: string } = {};
  for (const [key, value] of parsedUrl.searchParams.entries()) {
    params[key] = value;
  }

  return params;
}

// WebSocket setup
export function setupWebSocket(): WebSocketServer {
  const wss: WebSocketServer = new WebSocket.Server({ noServer: true });

  // WebSocket connection
  wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
    let isAuthentificated: boolean = false;
    const params: { [key: string]: string } = extractUrlParams(request);

    let playerUUID: string = "";
    let playerUsername: string = "";

    const token: string = params.token;
    let decoded: UserPayload | null = null;
    if (token) {
      try {
        decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
        if (decoded && decoded.uuid && typeof decoded.uuid === "string") {
          console.log(`User connected: ${decoded.uuid}`);

          const user: User = db
            .prepare("SELECT * FROM users WHERE uuid = ?")
            .get(decoded.uuid) as User;

          if (user) {
            isAuthentificated = true;
            playerUUID = user.uuid;
            playerUsername = user.name;
          }
        }
      } catch (error: any) {}
    }

    // If there is no token or the token is invalid, refuse the connection
    if (!isAuthentificated || !playerUUID || !playerUsername) {
      const errorMsg: ErrorMessage = {
        type: "error",
        msg: ERROR_MSG.TOKEN_MISSING_OR_INVALID,
        errorType: ERROR_TYPE.CONNECTION_REFUSED
      };
      ws.send(JSON.stringify(errorMsg));
      ws.close(); // Close the connection after sending the error message
      return;
    }

    // Check if player is already connected with this account
    if (players.has(playerUUID)) {
      const errorMsg: ErrorMessage = {
        type: "error",
        msg: ERROR_MSG.ALREADY_CONNECTED,
        errorType: ERROR_TYPE.CONNECTION_REFUSED
      };
      ws.send(JSON.stringify(errorMsg));
      ws.close(); // Close the connection after sending the error message
      return;
    }

    let player: Player;

    if (recentlyDisconnectedPlayers.has(playerUUID)) {
      player = recentlyDisconnectedPlayers.get(playerUUID)!.player;
      recentlyDisconnectedPlayers.delete(playerUUID);
      player.socket = ws;
      console.log(`[Reconnection] Player reconnected: ${player.username} (${playerUUID})`);
      player.room?.notifyReconnection(player);
    } else {
      player = {
        uuid: playerUUID,
        username: playerUsername,
        socket: ws,
        room: null,
        paddleSkinId: "",
      };
      console.log(`New player connected: ${player.username} (${playerUUID})`);
    }

    players.set(playerUUID, player);

    ws.on("message", (message: string) => {
      //console.log("Received data:", JSON.parse(message));

      try {
        const msgData: any = JSON.parse(message);

        if (!isGameMessage(msgData)) {
          return;
        }
        const data: GameMessageData = msgData.data;

        if (isMatchmakingMessage(data)) {
          console.log(`[Matchmaking] : ${player.username} (${playerUUID})`);
          addPlayerToMatchmaking(player);
        } else if (isSkinChangeMessage(data)) {
          if (player.room) {
            // Check if the player who send the message is the owner of the paddle
            if (data.id === player.room.indexOfPlayer(player)) {
              player.paddleSkinId = data.skinId;
              if (player.room.isGameLaunched()) {
                player.room.notifySkinUpdate(player);
              }
            }
          }
        } else if (isPaddlePositionMessage(data)) {
          // Update paddle positions if condition meeted
          if (player.room) {
            const index: -1 | 1 | 2 = player.room.indexOfPlayer(player);
            if (index !== -1) {
              player.room.setPaddlePosition(index, data.position);
            }
          }
        }
      } catch (error: any) {
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
      player.socket = null;
      if (player.room) {
        // Remove the player from the room if the game hasn't started
        if (!player.room.isGameLaunched()) {
          player.room?.removePlayer(player);
        }
      }
      players.delete(playerUUID);
      console.log(`Player disconnected: ${player.username} (${playerUUID})`);

      recentlyDisconnectedPlayers.set(playerUUID, {
          disconnectionTime: Date.now(),
          player: player
        } as DisconnectedPlayer
      );
    });
  });

  return wss;
}

const DISCONNECT_TIMEOUT: number = 30 * 1000; // 30 seconds in milliseconds

setInterval(() => {
  const currentTime: number = Date.now(); // Get the current time

  // Iterate over the recentlyDisconnectedPlayers map
  recentlyDisconnectedPlayers.forEach((disconnectedPlayer: DisconnectedPlayer, uuid: string) => {
    const timeSinceDisconnection: number = currentTime - disconnectedPlayer.disconnectionTime;

    // Check if the disconnection duration exceeds the timeout
    if (timeSinceDisconnection > DISCONNECT_TIMEOUT) {
      // Remove the player from the recentlyDisconnectedPlayers map
      disconnectedPlayer.player.room?.removePlayer(disconnectedPlayer.player);
      recentlyDisconnectedPlayers.delete(uuid);
      console.log(`Player with UUID ${uuid} removed after ${timeSinceDisconnection} ms.`);
    }
  });
}, 1000); // Run the interval every second
