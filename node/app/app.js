// app.js;
const path = require("path");
const fs = require("fs");
const fastify = require("fastify");

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

// Exemple de route
app.get("/", async (request, reply) => {
  return { hello: "https world" };
});

// Démarrer le serveur
const PORT = process.env.PORT;
app.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
});
