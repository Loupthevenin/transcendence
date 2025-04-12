import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { JWT_SECRET } from "../config";
import { User } from "../types/authTypes";

export async function setup2FA(request: FastifyRequest, reply: FastifyReply) {
  const email = request.user?.email;
  if (!email) {
    return reply.status(401).send({ error: "Invalid Token" });
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
  const email = request.user?.email;
  if (!email) {
    return reply.status(401).send({ message: "Invalid Token" });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as User;

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
