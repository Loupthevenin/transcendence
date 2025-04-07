import WebSocket, { WebSocketServer } from 'ws';

// Game state
interface GameState {
  ballPosition: BABYLON.Vector2;
  paddle1Position: BABYLON.Vector2;
  paddle2Position: BABYLON.Vector2;
}

const gameState: GameState = {
  ballPosition: new BABYLON.Vector2(0, 0),
  paddle1Position: new BABYLON.Vector2(0, 0),
  paddle2Position: new BABYLON.Vector2(0, 0)
};

// WebSocket setup
export function setupWebSocket(): WebSocketServer {
  const wss: WebSocketServer = new WebSocket.Server({ noServer: true });

  // WebSocket connection
  wss.on("connection", (ws: WebSocket) => {
    ws.on("message", (message: string) => {
      const data: { type: string; player: number; position: BABYLON.Vector2 } = JSON.parse(message);
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
