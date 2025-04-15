import { FastifyRequest, FastifyReply } from "fastify";
// import jwt from "jsonwebtoken";
// import db from "../db/db";

export async function handleGoogleCallback(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  reply.send({ ok: true });
}
