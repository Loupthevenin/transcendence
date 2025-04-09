import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import db from "../db/db";
// import jwt from "jsonwebtoken";

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

    return reply.send({ message: "Inscription réussie", requires2FA: false });
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

    // A modifier plus tard JWT_SECRET;
    // if (user.requires2FA) {
    //   const tempToken = jwt.sign(
    //     { email: user.email },
    //     process.end.JWT_SECRET as string,
    //   );
    //   return reply.send({ requires2FA: true, tempToken });
    // }

    return reply.send({ message: "Connexion réussie" });
  } catch (err) {
    console.error("Error login:", err);
    return reply.code(500).send({ message: "Erreur serveur" });
  }
}
