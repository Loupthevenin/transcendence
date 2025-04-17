import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { requireToken } from "../hook/requireToken";
import { getPublicProfile, getHistory } from "../controllers/publicProfileController";


export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.register(publicProfileRoutes);
}

async function publicProfileRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireToken);

  app.get("/:id", getPublicProfile);
  app.get("/history/:id", getHistory); 
}
