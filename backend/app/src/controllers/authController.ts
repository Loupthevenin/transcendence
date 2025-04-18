import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
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
) {
  const { name, email, password } = request.body;

  try {
    const existingUser = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email);

    if (existingUser) {
      return reply.code(400).send({ message: "Email déjà utilisé" });
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);

    const insert = db.prepare(
      "INSERT INTO users (uuid, name, email, password) VALUES (?, ?, ?, ?)",
    );
    insert.run(uuidv4(), name, email, hashedPassword);

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
  } catch (err) {
    console.error("Error signin:", err);
    return reply.code(500).send({ message: "Erreur serveur" });
  }
}

export async function verifyEmail(
  request: FastifyRequest<{ Querystring: { token: string } }>,
  reply: FastifyReply,
) {
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

    return reply.send({ message: "Email vérifié !" });
  } catch (err) {
    return reply.code(400).send({ message: "Lien invalide ou expiré." });
  }
}

export async function loginUser(
  request: FastifyRequest<{ Body: Login }>,
  reply: FastifyReply,
) {
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
        expiresIn: "2h",
      },
    );

    return reply.send({
      message: "Connexion réussie",
      token,
      require2FA: false,
    });
  } catch (err) {
    console.error("Error login:", err);
    return reply.code(500).send({ message: "Erreur serveur" });
  }
}
