import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import path from 'path';

// Serve static files (client-side code)
export default async function (app: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
  app.register(require("@fastify/static"), {
    root: path.join(__dirname, "../../client"),
  });
}