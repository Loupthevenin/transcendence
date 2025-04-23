import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { requireToken } from "../hook/requireToken";
import { getMatchIdData } from "../controllers/replayController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.addHook("onRequest", requireToken);
  app.get("/:match_id", getMatchIdData);
}
