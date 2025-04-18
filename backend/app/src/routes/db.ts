import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { listUsers, listMatchHistory } from "../controllers/dbController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.get("/users", listUsers);
  app.get("/match_history", listMatchHistory);
}
