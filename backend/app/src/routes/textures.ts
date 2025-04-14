import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getTexture } from "../controllers/assetsController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
) : Promise<void> {
  app.get("/:texture", getTexture);
}
