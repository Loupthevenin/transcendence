import { FastifyRequest, FastifyReply } from "fastify";
import { UserPayload } from "../types/UserPayload";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export async function requireToken(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const authHeader: string | undefined = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Missing or malformed token" });
    }

    const token: string = authHeader.split(" ")[1];
    const decoded: string | jwt.JwtPayload = jwt.verify(token, JWT_SECRET);
    if (typeof decoded == "string") {
      return reply.status(401).send({ error: "Invalid Token" });
    }
    request.user = decoded as UserPayload;
  } catch {
    reply.status(401).send({ error: "Unauthorized" });
  }
}
