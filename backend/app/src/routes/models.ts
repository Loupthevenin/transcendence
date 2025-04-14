import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import path from "path";
import fs from "fs";
import { ASSETS_PATH } from "../config";

type ModelInfo = {
  name: string;
  filepath: string;
};

// path for all models assets
const assetsModelPath: string = path.join(ASSETS_PATH, "models");

const modelReferences: Record<string, ModelInfo> = JSON.parse(
  fs.readFileSync(path.join(assetsModelPath, "./model-references.json"), "utf-8")
);

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.get("/:model_id", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { model_id } = request.params as { model_id: string };

      // Check if the model_id exists in the JSON file
      const modelInfo: ModelInfo = modelReferences[model_id];

      if (!modelInfo) {
        reply.status(404).send({ error: "Model not found" });
        return;
      }

      // Resolve the file path
      const modelFilePath: string = path.resolve(assetsModelPath, modelInfo.filepath);

      // Check if the file exists
      if (!fs.existsSync(modelFilePath)) {
        reply.status(404).send({ error: "Model file not found" });
        return;
      }

      // Read the file content
      const fileContent: Buffer = fs.readFileSync(modelFilePath);

      // Set the Content-Type header for .glb files and send the file
      reply.type("model/gltf-binary").send(fileContent);
    } catch (error) {
      reply.status(500).send({ error: "Internal server error" });
    }
  });
}
