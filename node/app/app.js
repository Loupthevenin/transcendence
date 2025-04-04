// app.js;
const path = require("path");
const fs = require("fs");
const fastify = require("fastify");
const db = require("./db");

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

// Démarrer le serveur
const PORT = process.env.PORT;
app.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
});
