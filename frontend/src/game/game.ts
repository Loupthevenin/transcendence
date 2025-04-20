import { BABYLON, GAME_CONSTANT, GameData, newGameData, disableSpecularOnMeshes } from "@shared/game/gameElements";
import { Ball, updateBallPosition, resetBall } from "@shared/game/ball";
import { SkinChangeMessage, isSkinChangeMessage, PaddlePositionMessage, isGameStartedMessage, isGameDataMessage, isGameResultMessage, isDisconnectionMessage, MatchmakingMessage } from "@shared/game/gameMessageTypes";
import { showSkinSelector, hideSkinSelector, getSelectedSkinId } from "./skinSelector";
import { createDefaultSkin, loadPadddleSkin } from "./paddleSkinLoader";
import { subscribeToMessage, unsubscribeToMessage, isConnected, sendMessage } from "../websocketManager";
import { GameMessageData } from "@shared/messageType"
import { LoadingHandler } from "./loadingHandler";

enum GameMode {
  MENU,         // Player is in the menu
  SINGLEPLAYER, // Singleplayer mode
  LOCAL,        // Local multiplayer mode
  ONLINE        // Online multiplayer mode
}

let currentGameMode: GameMode = GameMode.MENU;

const loadingHandler: LoadingHandler = new LoadingHandler();

let loadingScreen: HTMLDivElement | null = null;
let canvas: HTMLCanvasElement | null = null;

// Create the loading screen div
function createLoadingScreen(): void {
  // If the loading screen already exists, remove it
  if (loadingScreen) {
    loadingScreen.remove();
  }

  // Create the loading screen container
  loadingScreen = document.createElement("div");
  loadingScreen.id = "gameLoadingScreen";
  loadingScreen.className = "fixed inset-0 flex justify-center items-end z-11";

  // Create the outer container for the loading bar
  const loadingBarContainer: HTMLDivElement = document.createElement("div");
  loadingBarContainer.className = "w-1/2 bg-gray-700 rounded-md mx-4 mb-4";

  // Create the inner loading bar
  const loadingBar: HTMLDivElement = document.createElement("div");
  loadingBar.id = "gameLoadingBar";
  loadingBar.className = "h-4 bg-blue-500 rounded-md";
  loadingBar.style.width = "0"; // Initial width

  loadingBarContainer.appendChild(loadingBar);
  loadingScreen.appendChild(loadingBarContainer);
  document.body.appendChild(loadingScreen);
}

// Update the loading bar
function updateLoadingBar(proportion: number): void {
  const loadingBar: HTMLElement | null = document.getElementById("gameLoadingBar");
  if (loadingBar) {
    loadingBar.style.width = `${proportion * 100}%`; // Adjust width based on proportion (0 to 1)
  }
}

// Create the game canvas used by Babylon to render the game
export function createGameCanvas(): HTMLCanvasElement {
  // If a canvas already exists, remove it
  if (canvas) {
    canvas.remove();
  }

  canvas = document.createElement("canvas");
  canvas.id = "renderCanvas";
  canvas.className = "absolute top-0 left-0 w-full h-full z-10";
  canvas.style.visibility = "hidden";

  createLoadingScreen();

  return canvas;
}

let engine: BABYLON.Engine;
let scene: BABYLON.Scene;
let camera: BABYLON.ArcRotateCamera;
let light: BABYLON.HemisphericLight;

// Update camera rotation based on game mode
function updateCameraRotation(camera: BABYLON.ArcRotateCamera, gameMode: GameMode): void {
  if (!camera) {
    return;
  }

  switch (gameMode) {
    case GameMode.MENU:
      camera.alpha = BABYLON.Tools.ToRadians(180); // Horizontal rotation
      camera.beta = BABYLON.Tools.ToRadians(50); // Vertical rotation
      break;
    case GameMode.ONLINE:
      // If the player control the 2e paddle, rotate the camera to get the correct view
      // else do the same as SINGLEPLAYER and LOCAL
      if (playerId === 2) {
        camera.alpha = BABYLON.Tools.ToRadians(0); // Horizontal rotation
        camera.beta = BABYLON.Tools.ToRadians(0); // Vertical rotation
        break;
      }
    case GameMode.SINGLEPLAYER:
    case GameMode.LOCAL:
      camera.alpha = BABYLON.Tools.ToRadians(180); // Horizontal rotation
      camera.beta = BABYLON.Tools.ToRadians(0); // Vertical rotation
      break;
  }
}

let gameData: GameData = newGameData();

// environment
let ground: BABYLON.GroundMesh;

let paddle1Mesh: BABYLON.Mesh;
let paddle2Mesh: BABYLON.Mesh;

let ballMesh: BABYLON.Mesh;

let scoreFontTextureTop: BABYLON.DynamicTexture;
let scoreFontTextureBottom: BABYLON.DynamicTexture;

function updateScoreText(): void {
  function updateScoreFontTexture(fontTexture: BABYLON.DynamicTexture, leftScore: number, rightScore: number): void {
    fontTexture.clear();
  
    const text: string = `${leftScore} : ${rightScore}`;
    const fontSize: number = 80; // Font size in pixels
    const font: string = `bold ${fontSize}px Arial`;
  
    // Set the font on the dynamic texture
    fontTexture.drawText("", 0, 0, font, "white", "transparent"); // Needed to set the font size
  
    // Get the 2D context of the DynamicTexture
    const context: BABYLON.ICanvasRenderingContext = fontTexture.getContext();
    context.font = font;
  
    // Measure the text dimensions
    const leftScoreWidth: number = context.measureText(`${leftScore} `).width; // Width of left score + space
    const colonWidth: number = context.measureText(':').width; // Width of the colon
  
    // Calculate the centered position
    const textureWidth: number = fontTexture.getSize().width;
    const textureHeight: number = fontTexture.getSize().height;
    const x: number = textureWidth / 2 - (colonWidth / 2 + leftScoreWidth); // Position to align colon at the center
    const y: number = (textureHeight + fontSize) / 2;       // Center vertically
  
    // Draw the text centered
    fontTexture.drawText(text, x, y, font, "white", "transparent");
  }

  if (gameData) {
    if (scoreFontTextureTop) {
      updateScoreFontTexture(scoreFontTextureTop, gameData.p1Score, gameData.p2Score);
    }
    if (scoreFontTextureBottom) {
      updateScoreFontTexture(scoreFontTextureBottom, gameData.p2Score, gameData.p1Score);
    }
  }
}

// Paddle movement variables
let paddle1Input: number = 0;
let paddle2Input: number = 0;

// Add input handling for paddle movement
window.addEventListener("keydown", (event: KeyboardEvent) => {
  switch (event.code) {
    case "KeyW": // Move Paddle 1 (Player 1) Up
      if (currentGameMode !== GameMode.MENU) {
        paddle1Input |= 0b01;
      }
      break;
    case "KeyS": // Move Paddle 1 (Player 1) Down
      if (currentGameMode !== GameMode.MENU) {
        paddle1Input |= 0b10;
      }
      break;
    case "ArrowUp": // Move Paddle 2 (Player 2) Up
      if (currentGameMode === GameMode.LOCAL) {
        paddle2Input |= 0b01;
      }
      break;
    case "ArrowDown": // Move Paddle 2 (Player 2) Down
      if (currentGameMode === GameMode.LOCAL) {
        paddle2Input |= 0b10;
      }
      break;
  }
});

window.addEventListener("keyup", (event: KeyboardEvent) => {
  switch (event.code) {
    case "KeyW": // Stop Paddle 1 Up movement
      paddle1Input &= ~0b01;
      break;
    case "KeyS": // Stop Paddle 1 Down movement
      paddle1Input &= ~0b10;
      break;
    case "ArrowUp": // Stop Paddle 2 Up movement
      paddle2Input &= ~0b01;
      break;
    case "ArrowDown": // Stop Paddle 2 Down movement
      paddle2Input &= ~0b10;
      break;
  }
});

type PaddleDraggingData = {
  pointerId: number,
  targetX: number | null
}

const paddle1DraggingData: PaddleDraggingData = { pointerId: -1, targetX: null };
const paddle2DraggingData: PaddleDraggingData = { pointerId: -1, targetX: null };

// Function to handle player drag input
function handlePlayerDragInput(pointerInfo: BABYLON.PointerInfo): void {
  if (!engine || !gameData) {
    return;
  }

  // BABYLON.IMouseEvent.pointerId doesn't appear in typescript for some reason,
  // so we need to cast it as 'any' to access it
  const pointerId: number = (pointerInfo.event as any).pointerId;

  switch (pointerInfo.type) {
      case BABYLON.PointerEventTypes.POINTERDOWN:
          if (pointerInfo.pickInfo?.hit) {
            const pickedMesh: BABYLON.Nullable<BABYLON.AbstractMesh> = pointerInfo.pickInfo.pickedMesh;

            // Check if pickedMesh is not null and cast it to BABYLON.Mesh
            if (pickedMesh && pickedMesh instanceof BABYLON.Mesh) {
              if (pickedMesh === paddle1Mesh) {
                if (paddle1DraggingData.pointerId === -1) {
                  paddle1DraggingData.pointerId = pointerId;
                }
              } else if (pickedMesh === paddle2Mesh) {
                if (paddle2DraggingData.pointerId === -1) {
                  paddle2DraggingData.pointerId = pointerId;
                }
              }
            }
          }
          break;

      case BABYLON.PointerEventTypes.POINTERUP:
          if (paddle1DraggingData.pointerId === pointerId) {
            paddle1DraggingData.pointerId = -1;
            paddle1DraggingData.targetX = null;
          } else if (paddle2DraggingData.pointerId === pointerId) {
            paddle2DraggingData.pointerId = -1;
            paddle2DraggingData.targetX = null;
          }
          break;

      case BABYLON.PointerEventTypes.POINTERMOVE:
          let paddleDraggingData: PaddleDraggingData | null = null;

          // Get the correct paddle dragging data
          if (paddle1DraggingData.pointerId === pointerId) {
            paddleDraggingData = paddle1DraggingData;
          } else if (paddle2DraggingData.pointerId === pointerId) {
            paddleDraggingData = paddle2DraggingData;
          }

          // Assign the target X if found
          if (paddleDraggingData) {
            const pickInfo: BABYLON.PickingInfo = scene.pick(scene.pointerX, scene.pointerY);
            if (pickInfo?.hit) {
              paddleDraggingData.targetX = pickInfo.pickedPoint?.x ?? null;
            }
          }
          break;
  }
}

// Function to handle player input and update paddle position
function handlePlayerInput(paddlePosition: BABYLON.Vector2, paddleMesh: BABYLON.Mesh, keyInput: number, draggingData: PaddleDraggingData, deltaTime: number): void {
  if (keyInput === 0 && draggingData.pointerId === -1) {
    return; // No key input, no movement
  }

  let deltaX: number = 0;
  if (draggingData.pointerId !== -1) {
    if (draggingData.targetX !== null) {
      const computedDelta: number = (draggingData.targetX - paddlePosition.x) * GAME_CONSTANT.paddleSpeed * deltaTime;
      deltaX = Math.min(Math.max(computedDelta, -1), 1);
    }
  } else {
    deltaX = ((keyInput & 0b1) - ((keyInput >> 1) & 0b1)) * GAME_CONSTANT.paddleSpeed * deltaTime;
  }

  if (deltaX === 0) {
    return; // No delta, no movement
  }

  // Update and clamp paddle positions to prevent them from going out of bounds
  paddlePosition.x = Math.min(
    Math.max(paddlePosition.x + deltaX, GAME_CONSTANT.areaMinX + GAME_CONSTANT.paddleHalfWidth),
    GAME_CONSTANT.areaMaxX - GAME_CONSTANT.paddleHalfWidth,
  );

  // Update paddle mesh positions
  paddleMesh.position.x = paddlePosition.x;
}

// Function to handle AI input
function handleAIInput(paddlePosition: BABYLON.Vector2, paddleMesh: BABYLON.Mesh, ball: Ball, deltaTime: number): void {
  // TODO: do some weird math to predict the ball position instead of the current one
  const draggingData: PaddleDraggingData = { pointerId: -2, targetX: ball.position.x };
  handlePlayerInput(paddlePosition, paddleMesh, 0, draggingData, deltaTime);
}

// Function to set the skin id of the given paddle
function setPaddleSkin(paddle: 1 | 2, skinId: string): void {
  if (paddle === 1) {
    // Create a temporary mesh will waiting for server response if there is no mesh
    if (!paddle1Mesh) {
      paddle1Mesh = createDefaultSkin(scene);
    }
    loadPadddleSkin(skinId, scene).then((mesh: BABYLON.Mesh) => {
      if (paddle1Mesh) {
        paddle1Mesh.dispose(); // Delete the current mesh
      }
      paddle1Mesh = mesh;
      mesh.position = new BABYLON.Vector3(0, GAME_CONSTANT.paddleDepth / 2, GAME_CONSTANT.paddleDefaultZPosition);
    });
  }

  else if (paddle === 2) {
    // Create a temporary mesh will waiting for server response if there is no mesh
    if (!paddle2Mesh) {
      paddle2Mesh = createDefaultSkin(scene);
    }
    loadPadddleSkin(skinId, scene).then((mesh: BABYLON.Mesh) => {
      if (paddle2Mesh) {
        paddle2Mesh.dispose(); // Delete the current mesh
      }
      paddle2Mesh = mesh;
      mesh.position = new BABYLON.Vector3(0, GAME_CONSTANT.paddleDepth / 2, -GAME_CONSTANT.paddleDefaultZPosition);
      mesh.rotation = new BABYLON.Vector3(0, Math.PI, 0);
    });
  }
}

let playerId: -1 | 1 | 2 = -1; // Player ID (1 or 2) to identify which paddle the player controls
let localSkinId: string = "";

function handleGameMessages(data: GameMessageData): void {
  //console.log("Received:", data);
  try {
    if (isGameStartedMessage(data)) {
      playerId = data.id; // Set the player ID based on the server response
      if (playerId === 2) {
        // if we are the 2e player then set our skin to the 2e paddle and rotate camera
        setPaddleSkin(2, localSkinId);
        updateCameraRotation(camera, currentGameMode);
      }
      const skinChangeMessage: SkinChangeMessage = {
        type: "skinId",
        id: data.id,
        skinId: localSkinId
      }
      sendMessage("game", skinChangeMessage);
    }
    else if (isSkinChangeMessage(data)) {
      const otherPlayerId: 1 | 2 = data.id;
      if (playerId !== otherPlayerId) {
        setPaddleSkin(otherPlayerId, data.skinId);
      }
    }
    else if (isGameDataMessage(data)) {
      // Update game data with the received data
      gameData.ball.position = data.data.ball.position;
      if (playerId !== 1) {
        gameData.paddle1Position = data.data.paddle1Position;
      }
      if (playerId !== 2) {
        gameData.paddle2Position = data.data.paddle2Position;
      }

      if (gameData.p1Score !== data.data.p1Score || gameData.p2Score !== data.data.p2Score) {
        gameData.p1Score = data.data.p1Score;
        gameData.p2Score = data.data.p2Score;
        updateScoreText();
      }

      // Update the ball mesh position
      if (ballMesh) {
        ballMesh.position.x = gameData.ball.position.x;
        ballMesh.position.z = gameData.ball.position.y;
      }

      // Update the paddle mesh positions
      if (paddle1Mesh) {
        paddle1Mesh.position.x = gameData.paddle1Position.x;
        paddle1Mesh.position.z = gameData.paddle1Position.y;
      }
      if (paddle2Mesh) {
        paddle2Mesh.position.x = gameData.paddle2Position.x;
        paddle2Mesh.position.z = gameData.paddle2Position.y;
      }

      //lastUpdateTime = performance.now();
    }
    else if (isGameResultMessage(data)) {
      // TODO: display a beautiful game result screen, showing final score and the winner's nickname
      console.log(`Game result: ${data.p1Score} / ${data.p2Score}`);
      if (data.winner === playerId) {
        console.log("You win!");
      } else {
        console.log("You lose!");
      }
      playerId = -1; // Reset player ID

      if (currentGameMode == GameMode.ONLINE) {
        BackToMenu();
      }
    }
    else if (isDisconnectionMessage(data)) {
      console.log("The other player disconnected !");
      playerId = -1; // Reset player ID

      if (currentGameMode == GameMode.ONLINE) {
        BackToMenu();
      }
    }
  } catch (error) {
    console.error("An Error occured:", error);
  }
}

function registerToGameMessages(): void {
  subscribeToMessage("game", handleGameMessages);
}

function unregisterToGameMessages(): void {
  unsubscribeToMessage("game", handleGameMessages);
}

// Reset the game and all position
function resetGame(): void {
  gameData = newGameData();

  if (ballMesh) {
    ballMesh.position.x = gameData.ball.position.x;
    ballMesh.position.z = gameData.ball.position.y;
  }
  if (paddle1Mesh) {
    paddle1Mesh.position.x = gameData.paddle1Position.x;
    paddle1Mesh.position.z = gameData.paddle1Position.y;
  }
  if (paddle2Mesh) {
    paddle2Mesh.position.x = gameData.paddle2Position.x;
    paddle2Mesh.position.z = gameData.paddle2Position.y;
  }

  resetBall(gameData.ball);
  updateScoreText();
}

// Babylon.js setup
export function initGameEnvironment(): void {
  if (!canvas) {
    throw new Error("Canvas element is not created. Call CreateGameCanvas() first.");
  }
  if (engine) {
    engine.dispose(); // Dispose of the previous engine if it exists
  }

  engine = new BABYLON.Engine(canvas, true); // Initialize the Babylon.js engine

  scene = new BABYLON.Scene(engine); // Create a new scene

  camera = new BABYLON.ArcRotateCamera(
    "Camera",
    0, // Horizontal rotation
    0, // Vertical rotation
    10, // Distance from target
    new BABYLON.Vector3(0, 0, 0), // Target position
    scene,
  );
  camera.attachControl(canvas as HTMLElement, false);
  camera.inputs.clear(); // Delete all default camera's inputs

  updateCameraRotation(camera, currentGameMode);

  // Create an hemispheric light
  light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
  light.intensity = 1.0;

  const environmentSceneLoadingStateIndex: number = loadingHandler.addLoadingState();

  // Load the environment scene
  try {
    BABYLON.ImportMeshAsync("/api/models/scene.glb", scene, { pluginExtension: ".glb" }).then((result: BABYLON.ISceneLoaderAsyncResult) => {
      disableSpecularOnMeshes(result.meshes);

      const sceneMesh: BABYLON.Mesh = result.meshes[0] as BABYLON.Mesh; // Get the root of the model
      sceneMesh.position = new BABYLON.Vector3(0, 0, 0);
      sceneMesh.rotation = new BABYLON.Vector3(0, 0, 0);
    }).catch((error) => {
      console.error("An error occurred while loading model 'scene.glb' :", error);
    }).finally(() => loadingHandler.setLoaded(environmentSceneLoadingStateIndex));
  } catch (error) {
    console.error("An error occurred while loading model 'scene.glb' :", error);
    loadingHandler.setLoaded(environmentSceneLoadingStateIndex);
  }

  // Create the ground
  ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: GAME_CONSTANT.areaWidth, height: GAME_CONSTANT.areaHeight },
    scene,
  );
  ground.rotation.y = Math.PI / 2;

  const groundTextureLoadingStateIndex: number = loadingHandler.addLoadingState();
  const groundTextureLoadedCallback: () => void = () => loadingHandler.setLoaded(groundTextureLoadingStateIndex);

  const groundMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial(
    "groundMaterial",
    scene,
  );
  groundMaterial.specularColor = BABYLON.Color3.Black();
  groundMaterial.diffuseTexture = new BABYLON.Texture(
    "/api/textures/tennis_court.svg",
    scene,
    {
      samplingMode: BABYLON.Texture.NEAREST_SAMPLINGMODE,
      onLoad: groundTextureLoadedCallback,
      onError: groundTextureLoadedCallback,
    }
  );
  ground.material = groundMaterial;

  // Create the paddles
  setPaddleSkin(1, "0");
  setPaddleSkin(2, "1");

  // Create the ball
  ballMesh = BABYLON.MeshBuilder.CreateSphere(
    "ball",
    { diameter: GAME_CONSTANT.ballRadius * 2 },
    scene,
  );
  ballMesh.position = new BABYLON.Vector3(0, GAME_CONSTANT.ballRadius, 0);

  const ballMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial(
    "ballMaterial",
    scene,
  );
  ballMaterial.diffuseColor = BABYLON.Color3.Gray();
  ballMaterial.specularColor = BABYLON.Color3.Black();

  ballMesh.material = ballMaterial;

  // Helper function to create the both score display
  function createScoreDisplay(suffix: "Top" | "Bottom"): BABYLON.DynamicTexture {
    const scoreFontTexture: BABYLON.DynamicTexture = new BABYLON.DynamicTexture(
      "scoreFontTexture" + suffix,
      { width: 512, height: 128 },
      scene,
      true,
    );

    const scorePlane: BABYLON.Mesh = BABYLON.MeshBuilder.CreatePlane(
      "scorePlane" + suffix,
      { width: 4, height: 1 },
      scene
    );
    const side: -1 | 1 = suffix === "Bottom" ? -1 : 1;
    scorePlane.position = new BABYLON.Vector3(3.6 * side, 0, 0);
    scorePlane.rotation = new BABYLON.Vector3(Math.PI / 2, -Math.PI / 2 * side, 0);

    const scoreMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("scoreMaterial" + suffix, scene);
    scoreMaterial.specularColor = BABYLON.Color3.Black();
    scoreMaterial.diffuseTexture = scoreFontTexture;
    scoreMaterial.opacityTexture = scoreFontTexture; // Enable transparency
    scoreMaterial.alpha = 1;

    scorePlane.material = scoreMaterial;
    return scoreFontTexture;
  }

  // Create the score display
  scoreFontTextureTop = createScoreDisplay("Top");
  scoreFontTextureBottom = createScoreDisplay("Bottom");

  updateScoreText();

  scene.onPointerObservable.add(handlePlayerDragInput);

  //let lastUpdateTime: number = performance.now(); // For client prediction timing

  // Game render loop
  engine.runRenderLoop(() => {
    const deltaTime: number = engine.getDeltaTime() / 1000; // Get the delta time as seconds (default milliseconds)

    switch (currentGameMode) {
      case GameMode.MENU:
        handleAIInput(
          gameData.paddle1Position,
          paddle1Mesh,
          gameData.ball,
          deltaTime
        );

        handleAIInput(
          gameData.paddle2Position,
          paddle2Mesh,
          gameData.ball,
          deltaTime
        );

        camera.alpha += GAME_CONSTANT.cameraRotationSpeed * deltaTime;
        updateBallPosition(gameData, deltaTime, ballMesh);
        updateScoreText();
        break;

      case GameMode.SINGLEPLAYER:
        handlePlayerInput(
          gameData.paddle1Position,
          paddle1Mesh,
          paddle1Input,
          paddle1DraggingData,
          deltaTime
        )

        handleAIInput(
          gameData.paddle2Position,
          paddle2Mesh,
          gameData.ball,
          deltaTime
        );

        updateBallPosition(gameData, deltaTime, ballMesh);
        updateScoreText();
        break;

      case GameMode.LOCAL:
        handlePlayerInput(
          gameData.paddle1Position,
          paddle1Mesh,
          paddle1Input,
          paddle1DraggingData,
          deltaTime
        )

        handlePlayerInput(
          gameData.paddle2Position,
          paddle2Mesh,
          paddle2Input,
          paddle2DraggingData,
          deltaTime
        )

        updateBallPosition(gameData, deltaTime, ballMesh);
        updateScoreText();
        break;

      case GameMode.ONLINE:
        if (playerId === 1 || playerId === 2) {
          if (paddle1Input !== 0) {
            const isPlayer1: boolean = playerId === 1;
            const pos: BABYLON.Vector2 = isPlayer1 ? gameData.paddle1Position : gameData.paddle2Position;
            handlePlayerInput(
              pos,
              isPlayer1 ? paddle1Mesh : paddle2Mesh,
              isPlayer1 ? paddle1Input : ~paddle1Input, // If we are the 2e player inverse the input since the view is inverted
              isPlayer1 ? paddle1DraggingData : paddle2DraggingData,
              deltaTime
            )

            const paddleData: PaddlePositionMessage = {
              type: "paddlePosition",
              position: new BABYLON.Vector2(pos.x, pos.y)
            };
            sendMessage("game", paddleData);
          }
        }
        break;
    }

    // Render the scene
    scene.render();
  });

  // Handle window resizing
  window.addEventListener("resize", () => {
    if (engine) {
      engine.resize();
    }
  });

  // Anonymous function to wait until the game environment is loaded to show the canvas
  new Promise<void>((resolve) => {
    const interval: NodeJS.Timeout = setInterval(() => {
      updateLoadingBar(loadingHandler.getLoadedProportion());
      if (loadingHandler.isAllLoaded()) {
        clearInterval(interval); // Stop checking once loaded
        resolve(); // All the condition are met, we can resolve
      }
    }, 50); // Check every 50ms
  }).then(() => {
    if (loadingScreen) {
      loadingScreen.remove(); // Delete the loading screen
    }
    loadingScreen = null;
    if (canvas) {
      canvas.style.visibility = "visible"; // Show the game canvas
    }
    loadingHandler.clear();
  });

}

// Quit the game and go back to the menu
export function BackToMenu(): void {
  currentGameMode = GameMode.MENU;
  updateCameraRotation(camera, currentGameMode);
  unregisterToGameMessages();

  resetGame();

  showSkinSelector();
  setPaddleSkin(1, "");
  setPaddleSkin(2, "");
}

// Launch the game in single player against an AI opponent
export function SinglePlayer(): void {
  currentGameMode = GameMode.SINGLEPLAYER;
  updateCameraRotation(camera, currentGameMode);
  unregisterToGameMessages();

  resetGame();

  hideSkinSelector();
  setPaddleSkin(1, getSelectedSkinId());
  setPaddleSkin(2, "");
}

// Launch the game in local 1v1 mode
export function LocalGame(): void {
  currentGameMode = GameMode.LOCAL;
  updateCameraRotation(camera, currentGameMode);
  unregisterToGameMessages();

  resetGame();

  hideSkinSelector();
  setPaddleSkin(1, getSelectedSkinId());
  setPaddleSkin(2, getSelectedSkinId());
}

// Launch the game in online mode against a remote player
export function OnlineGame(): void {
  if (!isConnected()) {
    console.error("You are not connected to the server, cannot start an online game");
    return;
  }
  currentGameMode = GameMode.ONLINE;
  updateCameraRotation(camera, currentGameMode);

  resetGame();

  hideSkinSelector();
  localSkinId = getSelectedSkinId();
  setPaddleSkin(1, localSkinId);

  registerToGameMessages();
  const matchmakingMessage: MatchmakingMessage = { type: "matchmaking", username: `Player-${localSkinId}` };
  sendMessage("game", matchmakingMessage);
}

//// TO DELETE //// TO DELETE //// TO DELETE //// TO DELETE ////
////////////////////////////////////////////////////////////////
(window as any).BackToMenu = BackToMenu;
// (window as any).SinglePlayer = SinglePlayer;
// (window as any).LocalGame = LocalGame;
// (window as any).OnlineGame = OnlineGame;
////////////////////////////////////////////////////////////////


//////// DEBUG ONLY

let axesViewer: BABYLON.AxesViewer | null = null;

// Function to enable or disable the AxesViewer
function ToggleAxesViewer(size: number = 1): void {
  if (!scene) {
    return;
  }
  if (axesViewer) {
    axesViewer.dispose();
    axesViewer = null;
    console.log("AxesViewer disabled.");
  } else {
    axesViewer = new BABYLON.AxesViewer(scene, size);
    console.log("AxesViewer enabled.");
  }
}
// Expose the function to the console
(window as any).ToggleAxesViewer = ToggleAxesViewer;