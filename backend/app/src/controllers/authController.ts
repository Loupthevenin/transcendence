import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import db from "../db/db";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import qrcode from "qrcode";

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
  twofa_secret: string;
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

export async function setup2FA(
  request: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply,
) {
  const { email } = request.body;

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as User;
  if (!user) return reply.status(404).send({ error: "User not found" });

  const secret = speakeasy.generateSecret({
    name: `Transcendence (${email})`,
  });

  db.prepare("UPDATE users SET twofa_secret = ? WHERE email = ?").run(
    secret.base32,
    email,
  );

  // QR Code;
  if (!secret.otpauth_url) {
    return reply
      .send(500)
      .send({ error: "Impossible de générer l'URL OTPAuth" });
  }
  const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url);

  return reply.send({ qrCodeDataURL });
}

export async function verify2FA(
  request: FastifyRequest<{ Body: { code: string; tempToken: string } }>,
  reply: FastifyReply,
) {
  const { code, tempToken } = request.body;

  try {
    const decoded: any = jwt.verify(tempToken, JWT_SECRET);
    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(decoded.email) as User;

    if (!user || !user.twofa_secret) {
      return reply.status(400).send({ error: "2FA non configuré" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: "base32",
      token: code,
      window: 1,
    });

    if (!verified) {
      return reply.status(400).send({ error: "Code 2FA invalide" });
    }

    const finalToken = jwt.sign(
      { email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    return reply.send({ token: finalToken });
  } catch (err) {
    return reply.status(401).send({ error: "Token invalide" });
  }
}
