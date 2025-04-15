import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { handleGoogleCallback } from "../controllers/googleController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.get("/google/callback", handleGoogleCallback);
}
