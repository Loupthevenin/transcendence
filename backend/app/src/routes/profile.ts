import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { requireToken } from "../hook/requireToken";
import {
  getData,
  setName,
  setEmail,
  setAvatar,
} from "../controllers/profileController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.addHook("onRequest", requireToken);
  app.get("/", getData);
  app.put("/name", setName);
  app.put("/email", setEmail);
  app.put("/avatar", setAvatar);
}
