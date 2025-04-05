import WebSocket, { WebSocketServer } from 'ws';
import { Vector2 } from '../../utils/vector2';

// Game state
interface GameState {
  ballPosition: Vector2;
  paddle1Position: Vector2;
  paddle2Position: Vector2;
}

const gameState: GameState = {
  ballPosition: Vector2.zero(),
  paddle1Position: Vector2.zero(),
  paddle2Position: Vector2.zero(),
};

// WebSocket setup
export function setupWebSocket(): WebSocketServer {
  const wss: WebSocketServer = new WebSocket.Server({ noServer: true });

  // WebSocket connection
  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (message: string) => {
      const data: { type: string; player: number; position: Vector2 } = JSON.parse(message);
      // Update paddle positions
      if (data.type === "movePaddle") {
        if (data.player === 1) {
          gameState.paddle1Position = data.position;
        } else if (data.player === 2) {
          gameState.paddle2Position = data.position;
        }
      }

      // Broadcast updated game state to all players
      wss.clients.forEach((client: WebSocket) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(gameState));
        }
      });
    });

    ws.send(JSON.stringify(gameState)); // Send initial game state
  });

  return wss;
}
