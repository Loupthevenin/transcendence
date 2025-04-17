import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getModel, getPaddleModel, getPaddleModelIdsList } from "../controllers/assetsController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
) : Promise<void> {
  app.get("/:model", getModel);
  app.get("/paddles/:model_id", getPaddleModel);
  app.get("/paddles_list", getPaddleModelIdsList);
}
