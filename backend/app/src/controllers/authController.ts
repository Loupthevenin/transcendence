import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import { Statement } from "better-sqlite3";
import db from "../db/db";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import {
  JWT_SECRET,
  DOMAIN_NAME,
  PORT,
  EMAIL_USER,
  EMAIL_PASS,
} from "../config";
import { Register, Login, User } from "../types/authTypes";

export async function registerUser(
  request: FastifyRequest<{ Body: Register }>,
  reply: FastifyReply,
): Promise<void> {
  const { name, email, password } = request.body;

  try {
    const existingUser = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (existingUser) {
      return reply.code(400).send({ message: "Email déjà utilisé" });
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);

    const insert: Statement = db.prepare(
      "INSERT INTO users (uuid, name, email, password) VALUES (?, ?, ?, ?)",
    );
    insert.run(uuidv4(), name, email, hashedPassword);

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
	<h2>Bienvenue ${name} 👋</h2>
    <p>Merci de t’être inscrit ! Clique sur ce lien pour confirmer ton adresse :</p>
    <a href="${verificationLink}">Confirmer mon adresse</a>
    <br/>
    <small>Ce lien expire dans 24h</small>`,
    });

    return reply.send({
      message:
        "Inscription réussie. Vérifie ton email pour activer ton compte.",
    });
  } catch (error: any) {
    console.error("Error signin:", error);
    return reply.code(500).send({ message: "Erreur serveur" });
  }
}

export async function verifyEmail(
  request: FastifyRequest<{ Querystring: { token: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const token: string = request.query.token;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded.email) {
      return reply.code(400).send({ message: "Invalid Token" });
    }

    const user: User = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(decoded.email) as User;
    if (!user)
      return reply.code(404).send({ message: "Utilisateur non trouvé" });

    db.prepare("UPDATE users SET is_verified = 1 WHERE email = ?").run(
      decoded.email,
    );

    return reply.redirect(`https://${DOMAIN_NAME}:${PORT}/`);
  } catch (error: any) {
    return reply.code(400).send({ message: "Lien invalide ou expiré." });
  }
}

export async function loginUser(
  request: FastifyRequest<{ Body: Login }>,
  reply: FastifyReply,
): Promise<void> {
  const { email, password } = request.body;

  try {
    const user: User = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as User;

    if (!user) {
      return reply
        .code(400)
        .send({ message: "Email ou mot de passe incorrect" });
    }

    if (!user.password) {
      return reply.code(400).send({
        message: "Ce compte utilise Google. Connecte-toi avec Google.",
      });
    }
    const isPasswordValid: boolean = await bcrypt.compare(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      return reply
        .code(400)
        .send({ message: "Email ou mot de passe incorrect" });
    }

    if (!user.is_verified) {
      return reply.code(400).send({
        message: "Email non vérifié, veuillez vérifier votre adresse email",
      });
    }

    if (user.require2FA) {
      const tempToken: string = jwt.sign({ email: user.email }, JWT_SECRET, {
        expiresIn: "10m",
      });
      return reply.send({ require2FA: true, tempToken });
    }

    const token: string = jwt.sign(
      { uuid: user.uuid, name: user.name, email: user.email },
      JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    return reply.send({
      message: "Connexion réussie",
      token,
      require2FA: false,
    });
  } catch (error: any) {
    console.error("Error login:", error);
    return reply.code(500).send({ message: "Erreur serveur" });
  }
}
