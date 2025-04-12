import { FastifyRequest, FastifyReply } from "fastify";
import { UserPayload } from "../types/UserPayload";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";

export async function requireToken(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Missing or malformed token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded == "string") {
      return reply.status(401).send({ error: "Invalid Token" });
    }
    request.user = decoded as UserPayload;
  } catch {
    reply.status(401).send({ error: "Unauthorized" });
  }
}
