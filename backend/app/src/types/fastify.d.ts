import "fastify";
import { UserPayload } from "./UserPayload";

declare module "fastify" {
  interface FastifyRequest {
    user?: UserPayload;
  }
}
