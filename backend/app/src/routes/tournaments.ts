import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { requireToken } from "../hook/requireToken";
import { tournamentsController } from "../controllers/tournamentController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
) {
  app.addHook("onRequest", requireToken);
  app.get("/list", tournamentsController);
}
