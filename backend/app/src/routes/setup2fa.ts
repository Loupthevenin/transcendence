import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { setup2FA } from "../controllers/authController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.get("/", setup2FA);
}
