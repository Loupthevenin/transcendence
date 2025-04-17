import "fastify";
import "@fastify/oauth2";
import { Oauth2Namespace } from "@fastify/oauth2";
import { UserPayload } from "./UserPayload";

declare module "fastify" {
  interface FastifyRequest {
    user?: UserPayload;
  }
}

declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: Oauth2Namespace;
  }
}
