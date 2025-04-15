import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Player } from '../shared/game/gameElements';
import { Room } from "../shared/game/room";
import { scoreToWin } from "../shared/game/constants";
import { SkinChangeMessage, isSkinChangeMessage, isPaddlePositionMessage, isMatchmakingMessage } from "../shared/game/gameMessageTypes";
import { GameMessageData, isGameMessage } from "../shared/messageType"

const players: Map<string, Player> = new Map();
const rooms: Map<string, Room> = new Map();
let roomCounter: number = 1;

function addPlayerToRoom(player: Player) : Room {
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

// WebSocket setup
export function setupWebSocket() : WebSocketServer {
  const wss: WebSocketServer = new WebSocket.Server({ noServer: true });

  // WebSocket connection
  wss.on("connection", (ws: WebSocket) => {
    const playerId: string = uuidv4();

    const player: Player = {
      id: playerId,
      username: `Player-${playerId.substring(0, 8)}`,
      socket: ws,
      room: null,
      paddleSkinId: -1
    };

    players.set(playerId, player);
    console.log(`New player connected: ${player.username} (${playerId})`);

    ws.on("message", (message: string) => {
      //console.log('Received data:', JSON.parse(message));

      try {
        const msgData: any = JSON.parse(message);

        if (!isGameMessage(msgData)) {
          return;
        }
        const data: GameMessageData = msgData.data;

        if (isMatchmakingMessage(data)) {
          console.log(`[Matchmaking] : ${player.username} (${playerId})`);
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
        console.error('An Error occured:', error);
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
      players.delete(playerId);
      console.log(`Player disconnected: ${player.username} (${playerId})`);
    });
  });

  return wss;
}
