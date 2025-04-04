const Fastify = require('fastify');
const fs = require("fs");
const WebSocket = require('ws');
const db = require("./db");

const PORT = process.env.PORT;
const DOMAIN_NAME = process.env.DOMAIN_NAME;

// Load SSL keys
const httpsOptions = {
  key: fs.readFileSync("/etc/node/ssl/key.key"),
  cert: fs.readFileSync("/etc/node/ssl/key.crt"),
};

// Create an HTTPS Fastify serveur
const app = Fastify({
  //logger: true,
  https: httpsOptions,
});

// // Serve static files (client-side code)
app.register(require('@fastify/static'), {
  root: require('path').join(__dirname, '../client'),
  prefix: '/',
});

app.get('/config', (request, reply) => {
  reply.send({
    domainName: DOMAIN_NAME,
    port: PORT,
  });
});

// list users
app.get("/users", async (request, reply) => {
  const stmt = db.prepare("SELECT * FROM users");
  const users = stmt.all();
  return users;
});

// add users
app.get("/init", async (request, reply) => {
  const insert = db.prepare("INSERT INTO users (name) VALUES (?)");
  const info = insert.run("Loup");

  return { success: true, userId: info.lastInsertRowid };
});

// WebSocket setup
const wss = new WebSocket.Server({ noServer: true });

// Game state
let gameState = {
  ballPosition: { x: 0, z: 0 },
  paddle1Position: 0,
  paddle2Position: 0,
};

// WebSocket connection
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    // Example: Update paddle positions
    if (data.type === 'movePaddle') {
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
app.server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

app.setErrorHandler((error, request, reply) => {
  console.error(error);
  reply.status(500).send('Server error occurred');
});

// Start the server
app.listen({ host: "0.0.0.0", port: PORT }, (err, address) => {
  if (err) throw err;
  console.log(`Server running at ${DOMAIN_NAME}:${PORT}`);
});
