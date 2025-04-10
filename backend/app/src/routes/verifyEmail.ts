import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { verifyEmail } from "../controllers/authController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.get("/", verifyEmail);
}
