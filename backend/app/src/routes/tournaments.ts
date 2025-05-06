import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { requireToken } from "../hook/requireToken";
import {
  tournamentsController,
  tournamentProgression,
} from "../controllers/tournamentController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
) {
  app.addHook("onRequest", requireToken);
  app.get("/list", tournamentsController);
  app.get("/tournament", tournamentProgression);
}
