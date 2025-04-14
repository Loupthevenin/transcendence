import { FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";
import path from "path";
import db from "../db/db";
import fs from "fs";

import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { User } from "../types/authTypes";
import {
  DOMAIN_NAME,
  PORT,
  JWT_SECRET,
  EMAIL_USER,
  EMAIL_PASS,
} from "../config";

type UpdateBody = {
  name?: string;
  email?: string;
  avatarUrl?: string;
};

export async function getData(request: FastifyRequest, reply: FastifyReply) {
  const email: string | undefined = request.user?.email;
  if (!email) {
    return reply.status(401).send({ error: "Invalid Token" });
  }

  const user: User = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as User;
  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  return reply.send({
    name: user.name,
    email: user.email,
  });
}

export async function setName(
  request: FastifyRequest<{ Body: UpdateBody }>,
  reply: FastifyReply,
) {
  const email: string | undefined = request.user?.email;

  if (!email) {
    return reply.status(404).send({ error: "Invalid Token" });
  }
  const { name } = request.body;
  if (!name || typeof name !== "string") {
    return reply.status(400).send({ error: "Invalid Name" });
  }

  const cleanName = name.trim();
  try {
    db.prepare(`UPDATE users SET name = ? WHERE email = ?`).run(
      cleanName,
      email,
    );

    return reply.send({ success: true, updated: cleanName });
  } catch (err) {
    console.error("Erreur update profile : ", err);
    return reply.status(500).send({ error: "Erreur serveur" });
  }
}

export async function setEmail(
  request: FastifyRequest<{ Body: UpdateBody }>,
  reply: FastifyReply,
) {
  const oldEmail: string | undefined = request.user?.email;
  if (!oldEmail) {
    return reply.status(404).send({ error: "Invalid Token" });
  }
  const { email } = request.body;
  if (!email) {
    return reply.status(400).send({ error: "Invalid Email" });
  }

  const existingUser = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);
  if (existingUser) {
    return reply.status(400).send({ error: "Email already in use" });
  }
  db.prepare("UPDATE users SET email = ? WHERE email = ?").run(email, oldEmail);

  const emailToken: string = jwt.sign({ email: email }, JWT_SECRET, {
    expiresIn: "1d",
  });
  const verificationLink: string = `https://${DOMAIN_NAME}:${PORT}/api/verify-email?token=${emailToken}`;

  // ENVOI MAIL
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Transcendence" <${EMAIL_USER}>`,
    to: email,
    subject: "Vérifie ton adresse email",
    html: `
	<h2>Bienvenue 👋</h2>
    <p>Merci de t’être inscrit ! Clique sur ce lien pour confirmer ton adresse :</p>
    <a href="${verificationLink}">Confirmer mon adresse</a>
    <br/>
    <small>Ce lien expire dans 24h</small>`,
  });

  return reply.send({
    success: true,
    message: "Vérifie ton email pour réactiver ton compte.",
  });
}

export async function setAvatar(request: FastifyRequest, reply: FastifyReply) {
  const email: string | undefined = request.user?.email;
  if (!email) {
    return reply.status(404).send({ error: "Invalid Token" });
  }

  const data = await request.file();
  if (!data) {
    return reply.status(400).send({ error: "Fichier manquant" });
  }

  const ext = path.extname(data.filename);
  const hashedEmail = crypto.createHash("sha256").update(email).digest("hex");
  const filename = `${hashedEmail}${ext}`;
  const uploadPath = path.join(
    __dirname,
    "..",
    "..",
    "assets",
    "avatars",
    filename,
  );

  const writeStream = fs.createWriteStream(uploadPath);
  await data.file.pipe(writeStream);

  const avatarUrl = `https://${DOMAIN_NAME}:${PORT}/uploads/${filename}`;

  db.prepare("UPDATE users SET avatar_url = ? WHERE email = ?").run(
    avatarUrl,
    email,
  );

  return reply.send({ avatarUrl });
}
