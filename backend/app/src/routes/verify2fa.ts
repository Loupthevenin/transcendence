import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { verify2FA } from "../controllers/authController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.post("/", verify2FA);
}
