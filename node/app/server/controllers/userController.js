const db = require("../db");

exports.listUsers = async (request, reply) => {
  const stmt = db.prepare("SELECT * FROM users");
  const users = stmt.all();

  return reply.send(users);
};

exports.addUser = async (request, reply) => {
  const insert = db.prepare("INSERT INTO users (name) VALUES (?)");
  const info = insert.run("Loup");

  return reply.send({ success: true, userId: info.lastInsertRowid });
};
