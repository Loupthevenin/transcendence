import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import path from "path";
import fs from "fs";
import { ASSETS_PATH } from "../config";

// path for all textures assets
const assetsTexturePath: string = path.join(ASSETS_PATH, "textures");

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.get("/:texture", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { texture } = request.params as { texture: string };

      // Resolve the file path
      const textureFilePath: string = path.resolve(assetsTexturePath, texture);

      // Check if the file exists
      if (!fs.existsSync(textureFilePath)) {
        reply.status(404).send({ error: "Texture file not found" });
        return;
      }

      // Read the file content
      const fileContent: Buffer = fs.readFileSync(textureFilePath);

      // Send the file
      if (path.extname(textureFilePath) === ".svg") {
        reply.type("image/svg+xml");
      }
      reply.send(fileContent);
    } catch (error) {
      reply.status(500).send({ error: "Internal server error" });
    }
  });
}
