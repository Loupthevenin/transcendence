import { FastifyInstance, FastifyPluginOptions } from "fastify";
// import { requireToken } from "../hook/requireToken";
import { invite } from "../controllers/inviteController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.register(invite_to_game);
}

async function invite_to_game(app: FastifyInstance) {
  app.post("/", invite);

}