import { BABYLON } from "@shared/game/gameElements";

let canvas: HTMLCanvasElement | null = null;
let engine: BABYLON.Engine;
let scene: BABYLON.Scene;
let camera: BABYLON.ArcRotateCamera;
let light: BABYLON.HemisphericLight;

const modelIds: number[] = [0, 1, 2, 3, 4];

const models: (BABYLON.AbstractMesh | null)[] = [];
let currentIndex: number = 0;

// Mouse control variables
let isMouseDown: boolean = false;
let lastMouseX: number = 0;

// Create the canvas
export function CreateSkinSelectorCanvas(root: HTMLElement) : void {
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
async function loadModels() : Promise<void> {
  // Remove previous model if always in memory
  models.forEach((model: BABYLON.AbstractMesh | null) => {
    if (model) {
      model.dispose()
    }
  });
  models.length = 0; // Clear the array
  currentIndex = 0;

  try {
    // Use Promise.all to fetch all models concurrently
    const results: (BABYLON.AbstractMesh | null)[] = await Promise.all(
      modelIds.map(async (modelId: number) => {
        try {
          const result: BABYLON.ISceneLoaderAsyncResult =
            await BABYLON.ImportMeshAsync("/api/models/" + modelId, scene);
          const model: BABYLON.AbstractMesh = result.meshes[0]; // Get the root of the model
          model.setEnabled(false); // Disable by default
          model.position = new BABYLON.Vector3(0, 0, 0);
          model.rotation = new BABYLON.Vector3(0, 0, 0);

          // For each model, extract color and texture from the original material if exist
          for (const mesh of result.meshes) {
            const originalMaterial: BABYLON.Material | null = mesh.material;
    
            // Check if the original material exist
            if (originalMaterial) {
              if ((originalMaterial as any).specularColor) {
                // Set specular to Black to avoid any reflection
                (originalMaterial as any).specularColor = BABYLON.Color3.Black();
              }
            }
          }

          return model; // Return the model
        } catch (error) {
          console.error("Failed to load model:", error);
          return null; // Return null for failed loads to maintain the order
        }
      })
    );

    // Add all models (or nulls) to the models array
    models.push(...results);
  } catch (error) {
    console.error("Error occurred while loading models:", error);
  }

  updatePositions(); // Initial positioning
  console.log(models);
}

function updatePositions() : void {
  if (models.length === 0) return;

  const currentModel: BABYLON.AbstractMesh | null = models[currentIndex];
  const previousModel: BABYLON.AbstractMesh | null = models[(currentIndex - 1 + models.length) % models.length];
  const nextModel: BABYLON.AbstractMesh | null = models[(currentIndex + 1) % models.length];

  // Position the current model at the center
  if (currentModel) {
    currentModel.setEnabled(true);
    currentModel.position = new BABYLON.Vector3(0, 0, 0);
  }

  // Position the previous model to the left
  if (previousModel) {
    previousModel.setEnabled(true);
    previousModel.position = new BABYLON.Vector3(0, 1, -1);
  }

  // Position the next model to the right
  if (nextModel) {
    nextModel.setEnabled(true);
    nextModel.position = new BABYLON.Vector3(0, 1, 1);
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

// Keyboard input for navigation
function handleKeyDown(event: KeyboardEvent) : void {
  if (event.key === "ArrowRight") {
    currentIndex = (currentIndex + 1) % models.length;
    updatePositions();
  } else if (event.key === "ArrowLeft") {
    currentIndex = (currentIndex - 1 + models.length) % models.length;
    updatePositions();
  }
}

// Mouse controls for rotating the current model
function handleMouseInput(pointerInfo: BABYLON.PointerInfo) : void {
  switch (pointerInfo.type) {
      case BABYLON.PointerEventTypes.POINTERDOWN:
          isMouseDown = true;
          lastMouseX = pointerInfo.event.clientX;
          break;

      case BABYLON.PointerEventTypes.POINTERUP:
          isMouseDown = false;
          break;

      case BABYLON.PointerEventTypes.POINTERMOVE:
          if (isMouseDown) {
            const deltaX: number = lastMouseX - pointerInfo.event.clientX;
            lastMouseX = pointerInfo.event.clientX;

            const currentModel: BABYLON.AbstractMesh | null = models[currentIndex];
            if (currentModel) {
              currentModel.rotation.x += deltaX * 0.01;
            }
          }
          break;
  }
}

export function InitSkinSelector() : void {
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
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // transparent skybox
  //scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

  camera = new BABYLON.ArcRotateCamera(
    "Camera",
    0, // Horizontal rotation
    Math.PI, // Vertical rotation
    1.5, // Distance from target
    new BABYLON.Vector3(0, 0, 0), // Target position
    scene,
  );
  camera.attachControl(canvas as HTMLElement, false);
  camera.inputs.clear(); // Delete all default camera's inputs

  // Create an hemispheric light
  light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, -1, 0), scene);
  light.intensity = 1.0;

  //new BABYLON.AxesViewer(scene, 2);

  // Register input events
  window.removeEventListener("keydown", handleKeyDown); // Remove existing listener (if any) to prevent duplication
  window.addEventListener("keydown", handleKeyDown);

  scene.onPointerObservable.add(handleMouseInput);

  // Render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  // Resize event
  window.addEventListener("resize", () => {
    if (engine) {
      engine.resize();
    }
  });

  // Start loading models
  loadModels();
}

