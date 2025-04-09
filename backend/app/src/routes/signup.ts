import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { registerUser } from "../controllers/authController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.post("/", registerUser);
}
