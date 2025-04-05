const WebSocket = require("ws");

function setupWebSocket(server) {
  // WebSocket setup
  const wss = new WebSocket.Server({ noServer: true });

  // Game state
  let gameState = {
    ballPosition: { x: 0, z: 0 },
    paddle1Position: 0,
    paddle2Position: 0,
  };

  // WebSocket connection
  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      const data = JSON.parse(message);
      // Example: Update paddle positions
      if (data.type === "movePaddle") {
        if (data.player === 1) {
          gameState.paddle1Position = data.position;
        } else if (data.player === 2) {
          gameState.paddle2Position = data.position;
        }
      }

      // Broadcast updated game state to all players
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(gameState));
        }
      });
    });

    ws.send(JSON.stringify(gameState)); // Send initial game state
  });

  // Integrate WebSocket with Fastify
  server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });
}

module.exports = setupWebSocket;
