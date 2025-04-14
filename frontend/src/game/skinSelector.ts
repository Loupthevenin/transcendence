import { BABYLON } from "@shared/game/gameElements";

let canvas: HTMLCanvasElement | null = null;
let engine: BABYLON.Engine;
let scene: BABYLON.Scene;
let camera: BABYLON.ArcRotateCamera;

const modelPaths: string[] = [
  "./assets/models/Baseball_Bat.glb",
  "./assets/models/Baseball_Bat.glb",
  "./assets/models/Baseball_Ba.glb",
];

const models: (BABYLON.AbstractMesh | null)[] = [];
let currentIndex: number = 0;

// Mouse control variables
let isMouseDown: boolean = false;
let lastMouseX: number = 0;

export function CreateSkinSelectorCanvas(root: HTMLElement): void {
  // If a canvas already exists, remove it
  if (canvas) {
    canvas.remove();
    canvas = null;
  }

  canvas = document.createElement("canvas");
  canvas.id = "skinSelectorCanvas";

  root.appendChild(canvas);
}

// Load models dynamically
async function loadModels(): Promise<void> {
  for (const path of modelPaths) {
    try {
      const result: BABYLON.ISceneLoaderAsyncResult =
        await BABYLON.ImportMeshAsync(path, scene);
      //console.log(result);

      const model: BABYLON.AbstractMesh = result.meshes[0]; // get the root of the model
      model.setEnabled(false); // Disable by default
      models.push(model);

      // For each model, extract color and texture from the original material if exist
      for (const mesh of result.meshes) {
        const originalMaterial: BABYLON.Material | null = mesh.material;

        // Check if the original material exist
        if (originalMaterial) {
          // Create a new standard material
          const standardMaterial: BABYLON.StandardMaterial =
            new BABYLON.StandardMaterial(
              "StandardMaterial_" +
                (originalMaterial ? originalMaterial.name : mesh.name),
              scene,
            );

          // Check if the material has a diffuse texture (used in StandardMaterial)
          const diffuseTexture: BABYLON.BaseTexture | undefined = (
            originalMaterial as any
          ).diffuseTexture as BABYLON.BaseTexture | undefined;
          if (diffuseTexture) {
            standardMaterial.emissiveTexture = diffuseTexture; // Copy the texture reference
          }

          // Check if the material has a diffuse color
          if ((originalMaterial as any).albedoColor instanceof BABYLON.Color3) {
            standardMaterial.emissiveColor = (
              (originalMaterial as any).albedoColor as BABYLON.Color3
            ).clone();
          }

          // Assign the new standard material to the model
          mesh.material = standardMaterial;
        }
      }
    } catch (error) {
      console.error("Failed to load model:", error);
      models.push(null); // Add a 'null' model to avoid shifting the index
    }
  }
  updatePositions(); // Initial positioning
  //console.log(models);
}

function updatePositions(): void {
  if (models.length === 0) return;

  const currentModel: BABYLON.AbstractMesh | null = models[currentIndex];
  const previousModel: BABYLON.AbstractMesh | null =
    models[(currentIndex - 1 + models.length) % models.length];
  const nextModel: BABYLON.AbstractMesh | null =
    models[(currentIndex + 1) % models.length];

  // Position the current model at the center
  if (currentModel) {
    currentModel.setEnabled(true);
    currentModel.position = new BABYLON.Vector3(0, 0, 0);
    currentModel.rotation = new BABYLON.Vector3(0, 0, 0);
  }

  // Position the previous model to the left
  if (previousModel) {
    previousModel.setEnabled(true);
    previousModel.position = new BABYLON.Vector3(0, 1, -1);
    previousModel.rotation = new BABYLON.Vector3(0, 0, 0);
  }

  // Position the next model to the right
  if (nextModel) {
    nextModel.setEnabled(true);
    nextModel.position = new BABYLON.Vector3(0, 1, 1);
    nextModel.rotation = new BABYLON.Vector3(0, 0, 0);
  }

  // Hide other models
  models.forEach((model: BABYLON.AbstractMesh | null, index: number) => {
    if (model) {
      if (
        index !== currentIndex &&
        index !== (currentIndex - 1 + models.length) % models.length &&
        index !== (currentIndex + 1) % models.length
      ) {
        model.setEnabled(false);
      }
    }
  });
}

export function InitSkinSelector(): void {
  if (!canvas) {
    throw new Error(
      "Canvas element is not created. Call CreateSkinSelectorCanvas() first.",
    );
  }
  if (engine) {
    engine.dispose(); // Dispose of the previous engine if it exists
  }

  engine = new BABYLON.Engine(canvas, true);
  scene = new BABYLON.Scene(engine);
  //scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // transparent skybox
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

  camera = new BABYLON.ArcRotateCamera(
    "Camera",
    0, // Horizontal rotation
    Math.PI, // Vertical rotation
    3, // Distance from target
    new BABYLON.Vector3(0, 0, 0), // Target position
    scene,
  );
  camera.attachControl(canvas as HTMLElement, false);
  camera.inputs.clear(); // Delete all default camera's inputs

  //new BABYLON.AxesViewer(scene, 2);

  // Keyboard input for navigation
  window.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      currentIndex = (currentIndex + 1) % models.length;
      updatePositions();
    } else if (event.key === "ArrowLeft") {
      currentIndex = (currentIndex - 1 + models.length) % models.length;
      updatePositions();
    }
  });

  // Mouse controls for rotating the current model
  canvas.addEventListener("mousedown", (event: MouseEvent) => {
    isMouseDown = true;
    lastMouseX = event.clientX;
  });

  canvas.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  canvas.addEventListener("mousemove", (event: MouseEvent) => {
    if (isMouseDown) {
      const deltaX: number = event.clientX - lastMouseX;
      lastMouseX = event.clientX;

      const currentModel: BABYLON.AbstractMesh | null = models[currentIndex];
      if (currentModel) {
        currentModel.rotation.y += deltaX * 0.01;
      }
    }
  });

  // Render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  // Resize event
  window.addEventListener("resize", () => {
    engine.resize();
  });

  // Start loading models
  loadModels();
}

