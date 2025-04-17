import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { handleGoogleCallback } from "../controllers/googleController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.get("/google", async (request, reply) => {
    const url = await app.googleOAuth2.generateAuthorizationUri(request, reply);
    return reply.redirect(url);
  });
  app.get("/google/callback", handleGoogleCallback);
}
