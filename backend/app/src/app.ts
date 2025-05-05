import Fastify, {
  FastifyInstance,
  FastifyError,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyMultipart from "@fastify/multipart";
import fastifyOauth2 from "@fastify/oauth2";
import path from "path";
import { IncomingMessage } from "http";
import { Stream } from "stream";
import { WebSocketServer, WebSocket } from "ws";
import { setupWebSocket } from "./ws/setupWebSocket";
import {
  DOMAIN_NAME,
  PORT,
  DB_DIR,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  NODE_ENV,
} from "./config";

// Create a Fastify serveur
const app: FastifyInstance = Fastify({
  //logger: true
});

// Setup bodysize for Avatars
app.register(fastifyMultipart, {
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

// Serve Avatars for front
app.register(fastifyStatic, {
  root: path.join(DB_DIR, "avatars"),
  prefix: "/api/avatars/",
});

// Google OAUTH
app.register(fastifyOauth2, {
  name: "googleOAuth2",
  scope: ["openid", "profile", "email"],
  credentials: {
    client: {
      id: GOOGLE_CLIENT_ID,
      secret: GOOGLE_CLIENT_SECRET,
    },
    auth: fastifyOauth2.GOOGLE_CONFIGURATION,
  },
  startRedirectPath: "/google",
  callbackUri: `https://${DOMAIN_NAME}:${PORT}/api/auth/google/callback`,
} as any);

// Routes
app.register(require("./routes/google"), { prefix: "/api/auth" });
app.register(require("./routes/login"), { prefix: "/api/login" });
app.register(require("./routes/signup"), { prefix: "/api/signup" });
app.register(require("./routes/verifyEmail"), { prefix: "/api/verify-email" });
app.register(require("./routes/verifyToken"), { prefix: "/api/verify-token" });
app.register(require("./routes/verify2fa"), { prefix: "/api/verify-2fa" });
app.register(require("./routes/setup2fa"), { prefix: "/api/setup-2fa" });
app.register(require("./routes/profile"), { prefix: "/api/profile" });
app.register(require("./routes/replay"), { prefix: "/api/replay" });
app.register(require("./routes/models"), { prefix: "/api/models" });
app.register(require("./routes/textures"), { prefix: "/api/textures" });
app.register(require("./routes/blockchain"), { prefix: "/api/blockchain" });
app.register(require("./routes/tournaments"), { prefix: "/api/tournaments" });

if (NODE_ENV === "development") {
  app.register(require("./routes/db"), { prefix: "/api/db/" });
}

// Error handling
app.setErrorHandler(
  (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    console.error(error);
    reply.status(500).send("Server error occurred");
  },
);

// Start the server
app.listen(
  { host: "0.0.0.0", port: 3000 },
  (error: Error | null, address: string) => {
    if (error) throw error;
    console.log(`Server running at ${DOMAIN_NAME}:${PORT}`);

    const wss: WebSocketServer = setupWebSocket();

    // Integrate WebSocket with Fastify
    app.server.on(
      "upgrade",
      (request: IncomingMessage, socket: Stream.Duplex, head: Buffer) => {
        wss.handleUpgrade(request, socket, head, (client: WebSocket) => {
          wss.emit("connection", client, request);
        });
      },
    );
  },
);
