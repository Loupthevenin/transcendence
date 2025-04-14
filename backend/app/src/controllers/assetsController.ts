import { FastifyRequest, FastifyReply } from "fastify";
import path from "path";
import fs from "fs";
import { ASSETS_PATH } from "../config";

//////////////// MODELS ////////////////

type ModelInfo = {
  name: string;
  filepath: string;
};

// path for all models assets
const assetsModelPath: string = path.join(ASSETS_PATH, "models");

const modelReferences: Record<string, ModelInfo> = JSON.parse(
  fs.readFileSync(path.join(assetsModelPath, "model-references.json"), "utf-8")
);

export async function getModels(request: FastifyRequest, reply: FastifyReply) {
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
}

//////////////// TEXTURES ////////////////

// path for all textures assets
const assetsTexturePath: string = path.join(ASSETS_PATH, "textures");

export async function getTexture(request: FastifyRequest, reply: FastifyReply) : Promise<void> {
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
}