import { FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import db from "../db/db";
import { v4 as uuidv4 } from "uuid";

import { User } from "../types/authTypes";
import { DOMAIN_NAME, PORT, JWT_SECRET } from "../config";

interface GoogleUser {
  name: string;
  email: string;
  id: string;
  picture: string;
}

export async function handleGoogleCallback(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const googleToken =
    await request.server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
      request,
    );

  const response: any = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        authorization: `Bearer ${googleToken.token.access_token}`,
      },
    },
  );

  const googleUser: GoogleUser = await response.json();

  let user: User | undefined = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(googleUser.email) as User;

  if (user && user.password !== null) {
    return reply.redirect(
      `https://${DOMAIN_NAME}:${PORT}/callback#error=Ce%20compte%20utilise%20un%20mot%20de%20passe`,
    );
  }

  if (!user) {
    db.prepare(
      "INSERT INTO users (uuid, name, email, password, google_id, is_verified, avatar_url) VALUES (?, ?, ?, NULL, ?, 1, ?)",
    ).run(
      uuidv4(),
      googleUser.name,
      googleUser.email,
      googleUser.id,
      googleUser.picture,
    );
  } else {
    db.prepare("UPDATE users SET name = ?, avatar_url = ? WHERE email = ?").run(
      googleUser.name,
      googleUser.picture,
      googleUser.email,
    );
  }

  const updateUser: User = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(googleUser.email) as User;
  const require2FA: boolean = updateUser.require2FA;

  const token: string = jwt.sign(
    { uuid: updateUser.uuid, name: updateUser.name, email: updateUser.email },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  return reply.redirect(
    `https://${DOMAIN_NAME}:${PORT}/callback#token=${token}&require2FA=${require2FA}`,
  );
}
