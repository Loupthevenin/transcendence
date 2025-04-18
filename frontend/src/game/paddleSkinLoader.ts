import { BABYLON, GAME_CONSTANT, disableSpecularOnMeshes } from "@shared/game/gameElements";

// Create and return the default paddle skin
export function createDefaultSkin(scene: BABYLON.Scene): BABYLON.Mesh {
  const paddleMesh: BABYLON.Mesh = BABYLON.MeshBuilder.CreateBox(
    "defaultPaddle",
    {
      width: GAME_CONSTANT.paddleWidth,
      height: GAME_CONSTANT.paddleDepth,
      depth: GAME_CONSTANT.paddleDepth
    },
    scene,
  );
  paddleMesh.position = new BABYLON.Vector3(0, 0, 0);
  paddleMesh.rotation = new BABYLON.Vector3(0, 0, 0);

  const paddleMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial(
    "defaultPaddleMaterial",
    scene,
  );
  paddleMaterial.diffuseColor = BABYLON.Color3.Gray();
  paddleMaterial.specularColor = BABYLON.Color3.Black();

  paddleMesh.material = paddleMaterial;
  return paddleMesh;
}

// Load the paddle skin and return it, return the default paddle skin if an error occured
// if skinId is empty, load a random skin
export async function loadPadddleSkin(skinId: string, scene: BABYLON.Scene): Promise<BABYLON.Mesh> {
  return new Promise<BABYLON.Mesh>(async (resolve) => {
    try {
      const result: BABYLON.ISceneLoaderAsyncResult =
        await BABYLON.ImportMeshAsync("/api/models/paddles/" + skinId, scene, { pluginExtension: ".glb" });

      disableSpecularOnMeshes(result.meshes);

      const paddleMesh: BABYLON.Mesh = result.meshes[0] as BABYLON.Mesh; // Get the root of the model
      paddleMesh.position = new BABYLON.Vector3(0, 0, 0);
      paddleMesh.rotation = new BABYLON.Vector3(0, 0, 0);

      resolve(paddleMesh);

    } catch (error) {
      console.error("An error occurred while loading models:", error);
      resolve(createDefaultSkin(scene));
    }
  })
}