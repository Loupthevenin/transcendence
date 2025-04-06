import fs from "fs";
import Fastify, { FastifyInstance } from "fastify";
import { setupWebSocket } from "./ws/setupWebSocket";

const PORT: number = Number(process.env.PORT);
const DOMAIN_NAME: string = process.env.DOMAIN_NAME as string;

// Load SSL keys
const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH || ""),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH || ""),
};

// Create an HTTPS Fastify serveur
const app: FastifyInstance = Fastify({
  //logger: true,
  https: httpsOptions,
});

// Routes
app.register(require("./routes/index"), { prefix: "/" });
app.register(require("./routes/users"), { prefix: "/users" });
app.register(require("./routes/config"), { prefix: "/config" });

// Error handling
app.setErrorHandler((error, request, reply) => {
  console.error(error);
  reply.status(500).send("Server error occurred");
});

// Start the server
app.listen({ host: "0.0.0.0", port: PORT }, (err, address) => {
  if (err) throw err;
  console.log(`Server running at ${DOMAIN_NAME}:${PORT}`);

  const wss = setupWebSocket();

  // Integrate WebSocket with Fastify
  app.server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws: any) => {
      wss.emit("connection", ws, request);
    });
  });
});
