import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export default async function (app: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
  app.get("/", (request, reply) => {
    reply.send({
      domainName: process.env.DOMAIN_NAME,
      port: process.env.PORT,
      db_dir: process.env.DB_DIR,
      db_path: process.env.DB_PATH,
    });
  });
};
