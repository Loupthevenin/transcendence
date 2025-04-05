const path = require("path");
const fs = require("fs");
const fastify = require("fastify");
const db = require("./db");
const setupWebSocket = require("./ws");

const PORT = process.env.PORT;
const DOMAIN_NAME = process.env.DOMAIN_NAME;

// Charger les clés SSL
const httpsOptions = {
  key: fs.readFileSync("/etc/node/ssl/key.key"),
  cert: fs.readFileSync("/etc/node/ssl/key.crt"),
};

// Créer un serveur Fastify en HTTPS
const app = fastify({
  logger: true,
  https: httpsOptions,
});

// Routes
app.register(require("./routes/index"), { prefix: "/" });
app.register(require("./routes/users"), { prefix: "/users" });
app.register(require("./routes/config"), { prefix: "/config" });

// Démarrer le serveur
app.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) throw err;
  console.log(`Server running at ${DOMAIN_NAME}:${PORT}`);

  setupWebSocket(app.server);
});

app.setErrorHandler((error, request, reply) => {
  console.error(error);
  reply.status(500).send("Server error occurred");
});
