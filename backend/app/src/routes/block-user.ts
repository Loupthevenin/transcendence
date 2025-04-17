import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { requireToken } from "../hook/requireToken";
import { blockUser, getBlockedUsers, unblockUser, isUserBlocked } from "../controllers/blockUserController";


export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.register(blockUserRoutes);
}

async function blockUserRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireToken); 

  app.post("/", blockUser);
  app.get("/", getBlockedUsers);
  app.post("/unblock", unblockUser);
  app.get("/is-blocked", isUserBlocked);

}
