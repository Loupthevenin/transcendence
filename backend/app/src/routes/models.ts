import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getModels } from "../controllers/assetsController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
) : Promise<void> {
  app.get("/:model_id", getModels);
}
