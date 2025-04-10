import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import db from "../db/db";
import jwt from "jsonwebtoken";

interface Register {
  name: string;
  email: string;
  password: string;
}

interface Login {
  email: string;
  password: string;
}

interface User {
  name: string;
  email: string;
  password: string;
  requires2FA: boolean;
}

const JWT_SECRET: string = process.env.JWT_SECRET as string;

export async function registerUser(
  request: FastifyRequest<{ Body: Register }>,
  reply: FastifyReply,
) {
  const { name, email, password } = request.body;

  try {
    const existingUser = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (existingUser) {
      return reply.code(400).send({ message: "Email déjà utilisé" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insert = db.prepare(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    );
    insert.run(name, email, hashedPassword);

    const token = jwt.sign({ name, email }, JWT_SECRET as string, {
      expiresIn: "2h",
    });

    return reply.send({
      message: "Inscription réussie",
      token,
      requires2FA: false,
    });
  } catch (err) {
    console.error("Error signin:", err);
    return reply.code(500).send({ message: "Erreur serveur" });
  }
}

export async function loginUser(
  request: FastifyRequest<{ Body: Login }>,
  reply: FastifyReply,
) {
  const { email, password } = request.body;

  try {
    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as User;

    if (!user) {
      return reply
        .code(400)
        .send({ message: "Email ou mot de passe incorrect" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return reply
        .code(400)
        .send({ message: "Email ou mot de passe incorrect" });
    }

    if (user.requires2FA) {
      const tempToken = jwt.sign({ email: user.email }, JWT_SECRET, {
        expiresIn: "10m",
      });
      return reply.send({ requires2FA: true, tempToken });
    }

    const token = jwt.sign({ name: user.name, email: user.email }, JWT_SECRET, {
      expiresIn: "2h",
    });

    return reply.send({
      message: "Connexion réussie",
      token,
      requires2FA: false,
    });
  } catch (err) {
    console.error("Error login:", err);
    return reply.code(500).send({ message: "Erreur serveur" });
  }
}
