import { FastifyRequest, FastifyReply } from "fastify";
import path from "path";
import fs from "fs";
import { ASSETS_PATH } from "../config";

//////////////// MODELS ////////////////

// path for all models assets
const assetsModelsPath: string = path.join(ASSETS_PATH, "models");

export async function getModel(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.params || !(request.params as any).model) {
    reply.status(400).send({ error: "Empty request" });
    return;
  }

  try {
    const { model } = request.params as { model: string };

    // Resolve the file path
    const modelFilePath: string = path.resolve(assetsModelsPath, model);

    // Check if the file exists
    if (!fs.existsSync(modelFilePath)) {
      reply.status(404).send({ error: "Model file not found" });
      return;
    }

    // Check if the path is a directory
    const stats: fs.Stats = fs.statSync(modelFilePath); // Get file stats
    if (stats.isDirectory()) {
      reply.status(404).send({ error: "Model file not found" });
      return;
    }

    // Read the file content
    const fileContent: Buffer = fs.readFileSync(modelFilePath);

    // Set the Content-Type header for .glb files and send the file
    reply.type("model/gltf-binary").send(fileContent);
  } catch (error: any) {
    reply.status(500).send({ error: "Internal server error" });
  }
}

type PaddleModelInfo = {
  name: string;
  filepath: string;
};

// path for all paddles models assets
const assetsPaddlesModelsPath: string = path.join(assetsModelsPath, "paddles");

const paddleModelReferences: Record<string, PaddleModelInfo> = JSON.parse(
  fs.readFileSync(path.join(assetsPaddlesModelsPath, "model-references.json"), "utf-8")
);

// Function to get a random paddle model ID
export function getRandomPaddleModelId(): string {
  const keys: string[] = Object.keys(paddleModelReferences);
  return keys[Math.floor(Math.random() * keys.length)];
}

export async function getPaddleModel(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    let { model_id } = request.params as { model_id: string };

    // If the model_id undefined or empty then take a random model
    if (!model_id || model_id.length === 0) {
      model_id = getRandomPaddleModelId();
    }

    const modelInfo: PaddleModelInfo = paddleModelReferences[model_id];

    // Check if the model_id exists in the JSON file
    if (!modelInfo) {
      reply.status(404).send({ error: "Model not found" });
      return;
    }

    // Resolve the file path
    const modelFilePath: string = path.resolve(assetsPaddlesModelsPath, modelInfo.filepath);

    // Check if the file exists
    if (!fs.existsSync(modelFilePath)) {
      reply.status(404).send({ error: "Model file not found" });
      return;
    }

    // Read the file content
    const fileContent: Buffer = fs.readFileSync(modelFilePath);

    // Set the Content-Type header for .glb files and send the file
    reply.type("model/gltf-binary").send(fileContent);
  } catch (error: any) {
    reply.status(500).send({ error: "Internal server error" });
  }
}

export async function getPaddleModelIdsList(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    reply.type("application/json").send(JSON.stringify(Object.keys(paddleModelReferences)));
  } catch (error: any) {
    reply.status(500).send({ error: "Internal server error" });
  }
}

//////////////// TEXTURES ////////////////

// path for all textures assets
const assetsTexturesPath: string = path.join(ASSETS_PATH, "textures");

export async function getTexture(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.params || !(request.params as any).texture) {
    reply.status(400).send({ error: "Empty request" });
    return;
  }

  try {
    const { texture } = request.params as { texture: string };

    // Resolve the file path
    const textureFilePath: string = path.resolve(assetsTexturesPath, texture);

    // Check if the file exists
    if (!fs.existsSync(textureFilePath)) {
      reply.status(404).send({ error: "Texture file not found" });
      return;
    }

    // Check if the path is a directory
    const stats: fs.Stats = fs.statSync(textureFilePath); // Get file stats
    if (stats.isDirectory()) {
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
  } catch (error: any) {
    reply.status(500).send({ error: "Internal server error" });
  }
}