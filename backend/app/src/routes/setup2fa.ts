import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { setup2FA } from "../controllers/2FAController";
import { requireToken } from "../hook/requireToken";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.addHook("onRequest", requireToken);
  app.get("/", setup2FA);
}
