import { FastifyRequest, FastifyReply } from "fastify";
import path from "path";
import fs from "fs";
import { ASSETS_PATH } from "../config";

//////////////// MODELS ////////////////

// path for all models assets
const assetsModelsPath: string = path.join(ASSETS_PATH, "models");

export async function getModel(request: FastifyRequest, reply: FastifyReply) : Promise<void> {
  try {
    const { model } = request.params as { model: string };

    // Resolve the file path
    const modelFilePath: string = path.resolve(assetsModelsPath, model);

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

type PaddleModelInfo = {
  name: string;
  filepath: string;
};

// path for all paddles models assets
const assetsPaddlesModelsPath: string = path.join(assetsModelsPath, "paddles");

const paddleModelReferences: Record<string, PaddleModelInfo> = JSON.parse(
  fs.readFileSync(path.join(assetsPaddlesModelsPath, "model-references.json"), "utf-8")
);

export async function getPaddleModel(request: FastifyRequest, reply: FastifyReply) : Promise<void> {
  try {
    let { model_id } = request.params as { model_id: string };

    // If the model_id is negative then take a random model
    if (parseInt(model_id) < 0) {
      const keys: string[] = Object.keys(paddleModelReferences);
      model_id = keys[Math.floor(Math.random() * keys.length)];
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
  } catch (error) {
    reply.status(500).send({ error: "Internal server error" });
  }
}

//////////////// TEXTURES ////////////////

// path for all textures assets
const assetsTexturesPath: string = path.join(ASSETS_PATH, "textures");

export async function getTexture(request: FastifyRequest, reply: FastifyReply) : Promise<void> {
  try {
    const { texture } = request.params as { texture: string };

    // Resolve the file path
    const textureFilePath: string = path.resolve(assetsTexturesPath, texture);

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