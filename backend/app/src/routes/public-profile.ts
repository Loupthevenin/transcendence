import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { requireToken } from "../hook/requireToken";
import { getPublicProfile } from "../controllers/publicProfileController";


export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.register(publicProfileRoutes);
}

async function publicProfileRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireToken); // Protège toutes les routes de ce fichier

  app.get("/:id", getPublicProfile); // GET /public-profile/:id
}
