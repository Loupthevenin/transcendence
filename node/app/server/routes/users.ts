import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { listUsers, addUser} from "../controllers/userController";

export default async function (app: FastifyInstance, opts: FastifyPluginOptions): Promise<void> {
  app.get("/", listUsers);
  app.get("/init", addUser);
};
