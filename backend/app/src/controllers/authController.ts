import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import db from "../db/db";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import nodemailer from "nodemailer";

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
  require2FA: boolean;
  twofa_secret: string;
  is_verified: boolean;
}

const JWT_SECRET: string = process.env.JWT_SECRET as string;
const PORT: number = Number(process.env.PORT);
const EMAIL_USER: string = process.env.EMAIL_USER as string;
const EMAIL_PASS: string = process.env.EMAIL_PASS as string;

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

    const emailToken = jwt.sign({ email: email }, JWT_SECRET, {
      expiresIn: "1d",
    });
    const verificationLink = `https://localhost:${PORT}/api/verify-email?token=${emailToken}`;

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
  const token = request.query.token;

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded.email) {
      return reply.code(400).send({ message: "Token invalide" });
    }

    const user = db
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

    if (!user.is_verified) {
      return reply.code(400).send({
        message: "Email non vérifié, veuillez vérifier votre adresse email",
      });
    }

    if (user.require2FA) {
      const tempToken = jwt.sign({ email: user.email }, JWT_SECRET, {
        expiresIn: "10m",
      });
      return reply.send({ require2FA: true, tempToken });
    }

    const token = jwt.sign({ name: user.name, email: user.email }, JWT_SECRET, {
      expiresIn: "2h",
    });

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

export async function setup2FA(
  request: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply,
) {
  const token = request.headers.authorization?.split(" ")[1];
  if (!token) {
    return reply.status(401).send({ error: "Missing Token" });
  }

  const decoded: any = jwt.verify(token, JWT_SECRET);
  const email = decoded.email;
  if (!email) {
    return reply.status(401).send({ error: "Token invalide" });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as User;
  if (!user) return reply.status(404).send({ error: "User not found" });

  const secret = speakeasy.generateSecret({
    name: `Transcendence (${email})`,
  });

  db.prepare(
    "UPDATE users SET twofa_secret = ?, require2FA = ? WHERE email = ?",
  ).run(secret.base32, 1, email);

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
  request: FastifyRequest<{ Body: { code: string } }>,
  reply: FastifyReply,
) {
  const { code } = request.body;
  const tempToken = request.headers.authorization?.split(" ")[1];
  if (!tempToken) {
    return reply.status(401).send({ error: "Token manquant" });
  }

  const decoded: any = jwt.verify(tempToken, JWT_SECRET);
  if (!decoded.email) {
    return reply.status(401).send({ message: "Token invalide" });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(decoded.email) as User;

  if (!user || !user.twofa_secret) {
    return reply
      .status(404)
      .send({ error: "Utilisateur non trouvé ou 2FA non configuré" });
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
}
