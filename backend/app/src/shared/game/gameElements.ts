import * as BABYLON from "babylonjs";
import { GLTFFileLoader } from "babylonjs-loaders";
import * as GAME_CONSTANT from "./constants";
import { Ball, isBall } from "./ball";

export { BABYLON, GAME_CONSTANT };

// One of the method is deprecated, but its the only way I found to load this plugin to be able to load the 3d model
if (!BABYLON.SceneLoader.IsPluginForExtensionAvailable(".glb")) {
  BABYLON.RegisterSceneLoaderPlugin(new GLTFFileLoader());
}

// Check if the object has the correct structure for a Vector2
export function isVector2(data: any): data is BABYLON.Vector2 {
  return (
    data &&
    typeof data.x === "number" &&
    typeof data.y === "number"
  );
}

export type GameData = {
  ball: Ball;
  paddle1Position: BABYLON.Vector2;
  paddle2Position: BABYLON.Vector2;
  p1Score: number;
  p2Score: number;
}

export function isGameData(data: any): data is GameData {
  return (
    data &&
    typeof data.ball === "object" &&
    isBall(data.ball) &&
    isVector2(data.paddle1Position) &&
    isVector2(data.paddle2Position) &&
    typeof data.p1Score === "number" &&
    typeof data.p2Score === "number"
  );
}

export function newGameData(): GameData {
  return {
      ball: {
        position: new BABYLON.Vector2(0, 0),
        velocity: new BABYLON.Vector2(0, 0)
      },
      paddle1Position: new BABYLON.Vector2(0, GAME_CONSTANT.paddleDefaultZPosition),
      paddle2Position: new BABYLON.Vector2(0, -GAME_CONSTANT.paddleDefaultZPosition),
      p1Score: 0,
      p2Score: 0
    };
}

// For each model, disable specular from the original material if exist
export function disableSpecularOnMeshes(meshes: BABYLON.AbstractMesh[]): void {
  for (const mesh of meshes) {
    const originalMaterial: BABYLON.Material | null = mesh.material;

    // Check if the original material exists and has a specularColor property
    if (originalMaterial && (originalMaterial as any).specularColor) {
      // Set specular color to black to disable reflection
      (originalMaterial as any).specularColor = BABYLON.Color3.Black();
    }
  }
}
