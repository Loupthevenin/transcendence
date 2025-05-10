import { FastifyRequest, FastifyReply } from "fastify";
import { MultipartFile } from "@fastify/multipart";
import crypto from "crypto";
import path from "path";
import db from "../db/db";
import fs from "fs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import { User } from "../types/authTypes";
import { MatchHistoryRow } from "../types/profileTypes";
import { MatchHistory } from "../shared/match/matchHistory";
import {
  DOMAIN_NAME,
  PORT,
  DB_DIR,
  JWT_SECRET,
  EMAIL_USER,
  EMAIL_PASS,
} from "../config";
import { updateUsername } from "../ws/setupWebSocket";

type UpdateBody = {
  name?: string;
  email?: string;
  avatarUrl?: string;
};

export async function getData(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const email: string | undefined = request.user?.email;
  if (!email) {
    return reply.status(401).send({ message: "Invalid Token" });
  }

  const user: User = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as User;
  if (!user) {
    return reply.status(404).send({ message: "User not found" });
  }

  const updateBody: UpdateBody = {
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url,
  };
  return reply.send(updateBody);
}

export async function getHistory(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const uuid: string | undefined = request.user?.uuid;
  if (!uuid) {
    return reply.status(401).send({ message: "Invalid Token" });
  }

  const matches: MatchHistoryRow[] = db
    .prepare(
      `SELECT 
      mh.*, 
      ua.name AS player_a_name, 
      ub.name AS player_b_name
    FROM match_history mh
    JOIN users ua ON mh.player_a_uuid = ua.uuid
    JOIN users ub ON mh.player_b_uuid = ub.uuid
    WHERE mh.player_a_uuid = ? OR mh.player_b_uuid = ?
    ORDER BY mh.date DESC
  `,
    )
    .all(uuid, uuid) as MatchHistoryRow[];

  const history: MatchHistory[] = matches.map((match: MatchHistoryRow) => {
    const isPlayerA: boolean = match.player_a_uuid === uuid;

    const myScore: number = isPlayerA ? match.score_a : match.score_b;
    const opponentScore: number = isPlayerA ? match.score_b : match.score_a;
    const opponentName: string = isPlayerA
      ? match.player_b_name
      : match.player_a_name;

    const matchHistory: MatchHistory = {
      uuid: match.uuid,
      date: match.date,
      mode: match.mode,
      opponent: opponentName,
      result:
        match.winner === "draw"
          ? "draw"
          : match.winner === (isPlayerA ? "A" : "B")
            ? "win"
            : "lose",
      score: `${myScore} - ${opponentScore}`,
    };
    return matchHistory;
  });

  return reply.send(history);
}

export async function setName(
  request: FastifyRequest<{ Body: UpdateBody }>,
  reply: FastifyReply,
): Promise<void> {
  const email: string | undefined = request.user?.email;

  if (!email) {
    return reply.status(404).send({ error: "Invalid Token" });
  }
  const { name } = request.body;
  if (!name || typeof name !== "string") {
    return reply.status(400).send({ error: "Invalid Name" });
  }

  const cleanName: string = name.trim();
  try {
    db.prepare(`UPDATE users SET name = ? WHERE email = ?`).run(
      cleanName,
      email,
    );
    const user: { uuid: string } = db
      .prepare(`SELECT uuid FROM users WHERE email = ?`)
      .get(email) as { uuid: string };

    if (user) {
      updateUsername(user.uuid, cleanName);
    }

    return reply.send({ success: true, updated: cleanName });
  } catch (error: any) {
    console.error("Erreur update profile : ", error);
    return reply.status(500).send({ error: "Erreur serveur" });
  }
}

export async function setEmail(
  request: FastifyRequest<{ Body: UpdateBody }>,
  reply: FastifyReply,
): Promise<void> {
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
  const transporter: nodemailer.Transporter = nodemailer.createTransport({
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

export async function setAvatar(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const email: string | undefined = request.user?.email;
  if (!email) {
    return reply.status(404).send({ error: "Invalid Token" });
  }

  const data: MultipartFile | undefined = await request.file();
  if (!data) {
    return reply.status(400).send({ error: "Fichier manquant" });
  }

  const ext: string = path.extname(data.filename);
  const hashedEmail: string = crypto
    .createHash("sha256")
    .update(email)
    .digest("hex");
  const filename: string = `${hashedEmail}${ext}`;
  const uploadDir: string = path.join(DB_DIR, "avatars");

  fs.mkdirSync(uploadDir, { recursive: true });

  const uploadPath: string = path.join(uploadDir, filename);
  const writeStream: fs.WriteStream = fs.createWriteStream(uploadPath);
  await data.file.pipe(writeStream);

  const avatarUrl: string = `/api/avatars/${filename}`;

  db.prepare("UPDATE users SET avatar_url = ? WHERE email = ?").run(
    avatarUrl,
    email,
  );

  return reply.send({ avatarUrl });
}
