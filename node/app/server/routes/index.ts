import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import path from 'path';

export default async function (app: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
  // // Serve static files (client-side code)
  app.register(require("@fastify/static"), {
    root: path.join(__dirname, "../../client"),
  });
}