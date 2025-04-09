import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { loginUser } from "../controllers/authController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.post("/", loginUser);
}
