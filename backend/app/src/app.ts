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
import { WebSocketServer } from "ws";
import { setupWebSocket } from "./ws/setupWebSocket";
import {
  DOMAIN_NAME,
  PORT,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
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
  root: path.join(__dirname, "..", "assets", "avatars"),
  prefix: "/uploads/",
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
app.register(require("./routes/login"), { prefix: "/api/login" });
app.register(require("./routes/signup"), { prefix: "/api/signup" });
app.register(require("./routes/verifyEmail"), { prefix: "/api/verify-email" });
app.register(require("./routes/verify2fa"), { prefix: "/api/verify-2fa" });
app.register(require("./routes/setup2fa"), { prefix: "/api/setup-2fa" });
app.register(require("./routes/users"), { prefix: "/api/users" });
app.register(require("./routes/models"), { prefix: "/api/models" });
app.register(require("./routes/textures"), { prefix: "/api/textures" });
app.register(require("./routes/profile"), { prefix: "/api/profile" });
app.register(require("./routes/google"), { prefix: "/api/auth" });

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
  (err: Error | null, address: string) => {
    if (err) throw err;
    console.log(`Server running at ${DOMAIN_NAME}:${PORT}`);

    const wss: WebSocketServer = setupWebSocket();

    // Integrate WebSocket with Fastify
    app.server.on("upgrade", (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws: any) => {
        wss.emit("connection", ws, request);
      });
    });
  },
);
