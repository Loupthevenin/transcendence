import Fastify, { FastifyInstance } from "fastify";
import { setupWebSocket } from "./ws/setupWebSocket";

const PORT: number = Number(process.env.PORT);
const DOMAIN_NAME: string = process.env.DOMAIN_NAME as string;

// Create a Fastify serveur
const app: FastifyInstance = Fastify({
  //logger: true
});

// Routes
app.register(require("./routes/login"), { prefix: "/api/login" });
app.register(require("./routes/signup"), { prefix: "/api/signup" });
app.register(require("./routes/users"), { prefix: "/api/users" });
app.register(require("./routes/config"), { prefix: "/api/config" });

// Error handling
app.setErrorHandler((error, request, reply) => {
  console.error(error);
  reply.status(500).send("Server error occurred");
});

// Start the server
app.listen({ host: "0.0.0.0", port: 3000 }, (err, address) => {
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
