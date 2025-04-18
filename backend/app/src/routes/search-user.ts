// route/search-user.ts
import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { requireToken } from "../hook/requireToken";
import { searchUserHandler } from "../controllers/searchUserController";


export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.register(searchUserRoutes);
}

async function searchUserRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireToken); // Protège toutes les routes de ce fichier
  app.get("/", searchUserHandler);
}
