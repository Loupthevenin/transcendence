import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Player, PlayerPaddle } from '../shared/game/gameElements';
import { Room } from "../shared/game/room";
import { scoreToWin } from "../shared/game/constants";

const players: Map<string, Player> = new Map();
const rooms: Map<string, Room> = new Map();
let roomCounter: number = 1;

function addPlayerToRoom(player: Player) : Room {
  // Check for an available room
  for (const [, room] of rooms) {
      if (!room.isFull() && !room.gameLaunched) {
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
    };

    players.set(playerId, player);
    console.log(`New player connected: ${player.username} (${playerId})`);

    const room: Room = addPlayerToRoom(player);

    ws.on("message", (message: string) => {
      //console.log('Received data:', message);

      try {
        const data: PlayerPaddle = JSON.parse(message);

        // Update paddle positions
        if (room.player1?.id === player.id) {
          room.gameData.paddle1Position = data.position;
        } else if (room.player2?.id === player.id) {
          room.gameData.paddle2Position = data.position;
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
      room.removePlayer(player);
      players.delete(playerId);
      console.log(`Player disconnected: ${player.username} (${playerId})`);
    });

    // Start the game if room is full
    if (room.isFull()) {
      room.startGame().then(() => {
        console.log(`Game ended in room: ${room.id} with winner ${room.gameData.p1Score >= scoreToWin ? 1 : 2}`);
      }).catch((error) => {
        console.error(`Error starting game in room ${room.id}:`, error);
      }).finally(() => {
        // disconnect players and remove room from rooms map
        room.player1?.socket.close();
        room.player2?.socket.close();
        rooms.delete(room.id);
      });
    }
  });

  return wss;
}
