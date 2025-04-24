import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  setup2FA,
  check2FAStatus,
  disable2FA,
} from "../controllers/2FAController";
import { requireToken } from "../hook/requireToken";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.addHook("onRequest", requireToken);
  app.get("/", setup2FA);
  app.get("/check-2fa-status", check2FAStatus);
  app.get("/disable2fa", disable2FA);
}
