import {
  BABYLON,
  GAME_CONSTANT,
  GameData,
  newGameData,
  GameStats,
  newGameStats,
  disableSpecularOnMeshes,
} from "@shared/game/gameElements";
import { updateBallPosition, resetBall } from "@shared/game/ball";
import {
  INPUT,
  PaddleDraggingData,
  handleAIInput,
  handlePlayerInput,
} from "@shared/inputHandler";
import {
  SkinChangeMessage,
  isSkinChangeMessage,
  PaddlePositionMessage,
  isGameStartedMessage,
  isGameDataMessage,
  GameResultMessage,
  isGameResultMessage,
  DisconnectionMessage,
  isDisconnectionMessage,
  MatchmakingMessage,
  ReconnectionMessage,
  LeaveGameMessage,
  SpectatingRequestMessage,
} from "@shared/game/gameMessageTypes";
import {
  showSkinSelector,
  hideSkinSelector,
  getSelectedSkinId,
} from "./skinSelector";
import { createDefaultSkin, loadPadddleSkin } from "./paddleSkinLoader";
import {
  subscribeTo,
  unsubscribeTo,
  isConnected,
  sendMessage,
} from "../websocketManager";
import { GameMessageData } from "@shared/messageType";
import { LoadingHandler } from "./loadingHandler";
import {
  showGameModeSelectionMenu,
  hideGameModeSelectionMenu,
} from "../controllers/gameMode";
import { PositionData, ScoreData } from "@shared/game/replayData";
import enableCanvasExtension from "../utils/canvasExtensionEnabler";
import { LaunchMatchMessage } from "@shared/tournament/tournamentMessageTypes";
import { navigateTo } from "../router";
import { showErrorToast } from "../components/showNotificationToast";

enum GameMode {
  MENU, // Player is in the menu
  SINGLEPLAYER, // Singleplayer mode
  LOCAL, // Local multiplayer mode
  ONLINE, // Online multiplayer mode
  SPECTATING, // The player is spectating a match
  REPLAY, // The player is watching a replay of a match
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
  const loadingBar: HTMLElement | null =
    document.getElementById("gameLoadingBar");
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

  enableCanvasExtension(canvas);

  createLoadingScreen();

  return canvas;
}

let engine: BABYLON.Engine;
let scene: BABYLON.Scene;
let camera: BABYLON.ArcRotateCamera;
let light: BABYLON.HemisphericLight;

// Update camera rotation based on game mode
function updateCameraMode(camera: BABYLON.ArcRotateCamera): void {
  if (!camera) return;

  switch (currentGameMode) {
    case GameMode.MENU:
      camera.alpha = BABYLON.Tools.ToRadians(180); // Horizontal rotation
      camera.beta = BABYLON.Tools.ToRadians(50); // Vertical rotation
      break;
    case GameMode.ONLINE:
      // If the player control the 2e paddle, rotate the camera to get the correct view
      if (playerId === 2) {
        camera.alpha = BABYLON.Tools.ToRadians(0); // Horizontal rotation
        camera.beta = BABYLON.Tools.ToRadians(0); // Vertical rotation
        break;
      }
    // else do the default one
    case GameMode.SINGLEPLAYER:
    case GameMode.LOCAL:
    case GameMode.SPECTATING:
    case GameMode.REPLAY:
      camera.alpha = BABYLON.Tools.ToRadians(180); // Horizontal rotation
      camera.beta = BABYLON.Tools.ToRadians(0); // Vertical rotation
      break;
  }

  // Clear all existing inputs
  camera.inputs.clear();

  // Set if the user can rotate the camera
  if (
    currentGameMode === GameMode.SPECTATING ||
    currentGameMode === GameMode.REPLAY
  ) {
    const rotateInput: BABYLON.ArcRotateCameraPointersInput =
      new BABYLON.ArcRotateCameraPointersInput();
    camera.inputs.add(rotateInput);

    // Disable movement and zoom
    camera.panningSensibility = 0; // Disable panning
    camera.wheelPrecision = 0; // Disable zoom

    // Limit vertical rotation
    camera.lowerBetaLimit = 0; // Prevent looking below the horizon
    camera.upperBetaLimit = BABYLON.Tools.ToRadians(65); // Limit upward tilt to 65°

    // Attach controls again to ensure activation
    camera.attachControl(canvas as HTMLElement, false);
  }
}

let gameData: GameData = newGameData();
let gameStats: GameStats = newGameStats();

// environment
let ground: BABYLON.GroundMesh;

let paddle1Mesh: BABYLON.Mesh;
let paddle2Mesh: BABYLON.Mesh;

let ballMesh: BABYLON.Mesh;

let scoreFontTextureTop: BABYLON.DynamicTexture;
let scoreFontTextureBottom: BABYLON.DynamicTexture;

function updateScoreText(): void {
  function updateScoreFontTexture(
    fontTexture: BABYLON.DynamicTexture,
    leftScore: number,
    rightScore: number,
  ): void {
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
    const colonWidth: number = context.measureText(":").width; // Width of the colon

    // Calculate the centered position
    const textureWidth: number = fontTexture.getSize().width;
    const textureHeight: number = fontTexture.getSize().height;
    const x: number = textureWidth / 2 - (colonWidth / 2 + leftScoreWidth); // Position to align colon at the center
    const y: number = (textureHeight + fontSize) / 2; // Center vertically

    // Draw the text centered
    fontTexture.drawText(text, x, y, font, "white", "transparent");
  }

  if (gameData) {
    if (scoreFontTextureTop) {
      updateScoreFontTexture(
        scoreFontTextureTop,
        gameData.p1Score,
        gameData.p2Score,
      );
    }
    if (scoreFontTextureBottom) {
      updateScoreFontTexture(
        scoreFontTextureBottom,
        gameData.p2Score,
        gameData.p1Score,
      );
    }
  }
}

// Paddle movement variables
let paddle1Input: INPUT = 0;
let paddle2Input: INPUT = 0;

// Add input handling for paddle movement
window.addEventListener("keydown", (event: KeyboardEvent) => {
  switch (event.code) {
    case "KeyW": // Move Paddle 1 (Player 1) Up
      if (
        currentGameMode === GameMode.SINGLEPLAYER ||
        currentGameMode === GameMode.LOCAL ||
        currentGameMode === GameMode.ONLINE
      ) {
        paddle1Input |= INPUT.UP;
      }
      break;
    case "KeyS": // Move Paddle 1 (Player 1) Down
      if (
        currentGameMode === GameMode.SINGLEPLAYER ||
        currentGameMode === GameMode.LOCAL ||
        currentGameMode === GameMode.ONLINE
      ) {
        paddle1Input |= INPUT.DOWN;
      }
      break;
    case "ArrowUp": // Move Paddle 2 (Player 2) Up
      if (currentGameMode === GameMode.LOCAL) {
        paddle2Input |= INPUT.UP;
      }
      break;
    case "ArrowDown": // Move Paddle 2 (Player 2) Down
      if (currentGameMode === GameMode.LOCAL) {
        paddle2Input |= INPUT.DOWN;
      }
      break;
  }
});

window.addEventListener("keyup", (event: KeyboardEvent) => {
  switch (event.code) {
    case "KeyW": // Stop Paddle 1 Up movement
      paddle1Input &= ~INPUT.UP;
      break;
    case "KeyS": // Stop Paddle 1 Down movement
      paddle1Input &= ~INPUT.DOWN;
      break;
    case "ArrowUp": // Stop Paddle 2 Up movement
      paddle2Input &= ~INPUT.UP;
      break;
    case "ArrowDown": // Stop Paddle 2 Down movement
      paddle2Input &= ~INPUT.DOWN;
      break;
  }
});

const paddle1DraggingData: PaddleDraggingData = {
  pointerId: -1,
  targetX: null,
};
const paddle2DraggingData: PaddleDraggingData = {
  pointerId: -1,
  targetX: null,
};

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
        const pickedMesh: BABYLON.Nullable<BABYLON.AbstractMesh> =
          pointerInfo.pickInfo.pickedMesh;

        // Check if pickedMesh is not null and cast it to BABYLON.Mesh
        if (pickedMesh && pickedMesh instanceof BABYLON.Mesh) {
          // Traverse up the parent chain to find the root node
          let root: BABYLON.AbstractMesh | null = pickedMesh;
          while (root.parent) {
            root = root.parent as BABYLON.AbstractMesh;
          }

          if (root) {
            if (root === paddle1Mesh) {
              if (paddle1DraggingData.pointerId === -1) {
                paddle1DraggingData.pointerId = pointerId;
              }
            } else if (root === paddle2Mesh) {
              if (paddle2DraggingData.pointerId === -1) {
                paddle2DraggingData.pointerId = pointerId;
              }
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
        const pickInfo: BABYLON.PickingInfo = scene.pick(
          scene.pointerX,
          scene.pointerY,
        );
        if (pickInfo.hit) {
          paddleDraggingData.targetX = pickInfo.pickedPoint?.x ?? null;
        }
      }
      break;
  }
}

// Keep track of which skin each paddle have
let cachedPaddle1Skin: string = "";
let cachedPaddle2Skin: string = "";

// Global request trackers for each paddle
let paddle1SkinRequestId: number = 0;
let paddle2SkinRequestId: number = 0;

// Function to set the skin id of the given paddle
function setPaddleSkin(paddle: 1 | 2, skinId: string): void {
  if (paddle === 1) {
    const currentRequestId: number = ++paddle1SkinRequestId; // Increment and store the request ID

    // Create a temporary mesh will waiting for server response if there is no mesh
    if (!paddle1Mesh) {
      paddle1Mesh = createDefaultSkin(scene);
      paddle1Mesh.position = new BABYLON.Vector3(
        0,
        GAME_CONSTANT.paddleDepth / 2,
        GAME_CONSTANT.paddleDefaultZPosition,
      );
      cachedPaddle1Skin = "";
    }

    if (cachedPaddle1Skin === skinId && skinId != "") {
      return; // Already have this skin attributed, so do nothing
    }

    loadPadddleSkin(skinId, scene).then((mesh: BABYLON.Mesh) => {
      if (currentRequestId !== paddle1SkinRequestId) {
        // If this request is outdated, ignore it
        mesh.dispose(); // Dispose of the new mesh since it won't be used
        return;
      }

      if (paddle1Mesh) {
        paddle1Mesh.dispose(); // Delete the current mesh
      }
      paddle1Mesh = mesh;
      cachedPaddle1Skin = skinId;
      mesh.position = new BABYLON.Vector3(
        0,
        GAME_CONSTANT.paddleDepth / 2,
        GAME_CONSTANT.paddleDefaultZPosition,
      );
    });
  } else if (paddle === 2) {
    const currentRequestId: number = ++paddle2SkinRequestId; // Increment and store the request ID

    // Create a temporary mesh will waiting for server response if there is no mesh
    if (!paddle2Mesh) {
      paddle2Mesh = createDefaultSkin(scene);
      paddle2Mesh.position = new BABYLON.Vector3(
        0,
        GAME_CONSTANT.paddleDepth / 2,
        -GAME_CONSTANT.paddleDefaultZPosition,
      );
      cachedPaddle2Skin = "";
    }

    if (cachedPaddle2Skin === skinId && skinId != "") {
      return; // Already have this skin attributed, so do nothing
    }

    loadPadddleSkin(skinId, scene).then((mesh: BABYLON.Mesh) => {
      if (currentRequestId !== paddle2SkinRequestId) {
        // If this request is outdated, ignore it
        mesh.dispose(); // Dispose of the new mesh since it won't be used
        return;
      }

      if (paddle2Mesh) {
        paddle2Mesh.dispose(); // Delete the current mesh
      }
      paddle2Mesh = mesh;
      cachedPaddle2Skin = skinId;
      mesh.position = new BABYLON.Vector3(
        0,
        GAME_CONSTANT.paddleDepth / 2,
        -GAME_CONSTANT.paddleDefaultZPosition,
      );
      mesh.rotation = new BABYLON.Vector3(0, Math.PI, 0);
    });
  }
}

let playerId: -1 | 1 | 2 = -1; // Player ID (1 or 2) to identify which paddle the player controls
let localSkinId: string = "";

// Variables to limit the websocket messages send to the server in the main loop
let lastSendTime: number = 0;
const sendRateInterval: number = 1000 / 60; // 60 times per seconds

export function handleGameReconnection(
  reconnectionData: ReconnectionMessage,
): void {
  playerId = reconnectionData.id; // Set the same player ID as before the disconnection
  setPaddleSkin(playerId, reconnectionData.selfSkinId); // Set the skin of the player's paddle
  setPaddleSkin(playerId === 1 ? 2 : 1, reconnectionData.otherSkinId); // Set the skin of the other player's paddle
  updateCameraMode(camera);
}

export function handleTournamentGameLaunch(): void {
  playerId = -1; // Set the player ID to -1 to wait for game start
  setPaddleSkin(1, getSelectedSkinId()); // Set the skin of the player's paddle
  updateCameraMode(camera);

  const interval: NodeJS.Timeout = setInterval(() => {
    updateLoadingBar(loadingHandler.getLoadedProportion());
    if (loadingHandler.isAllLoaded()) {
      clearInterval(interval); // Stop checking once loaded
      // Loading ended, we can send back the request
      sendMessage("tournament", { type: "launchMatch" } as LaunchMatchMessage);
    }
  }, 50); // Check every 50ms
}

export function handleGameMessages(data: GameMessageData): void {
  console.log("Received:", data);
  console.warn("[DEBUG] Message reçu alors que gameMode = ", currentGameMode);

  // Avoid modifying data if not in an online mode
  if (currentGameMode !== GameMode.ONLINE && currentGameMode !== GameMode.SPECTATING) return;

  try {
    if (isGameStartedMessage(data)) {
      playerId = data.id; // Set the player ID based on the server response
      setPaddleSkin(playerId, localSkinId);
      updateCameraMode(camera);
      const skinChangeMessage: SkinChangeMessage = {
        type: "skinId",
        id: data.id,
        skinId: localSkinId,
      };
      sendMessage("game", skinChangeMessage);
    } else if (isSkinChangeMessage(data)) {
      // Only modify other's skin
      if (playerId !== data.id) {
        setPaddleSkin(data.id, data.skinId);
      }
    } else if (isGameDataMessage(data)) {
      // Update game data with the received data
      gameData.ball.position = data.data.ball.position;
      if (playerId !== 1) {
        gameData.paddle1Position = data.data.paddle1Position;
      }
      if (playerId !== 2) {
        gameData.paddle2Position = data.data.paddle2Position;
      }

      if (
        gameData.p1Score !== data.data.p1Score ||
        gameData.p2Score !== data.data.p2Score
      ) {
        gameData.p1Score = data.data.p1Score;
        gameData.p2Score = data.data.p2Score;
        updateScoreText();
      }

      updateAllPositions();

      //lastUpdateTime = performance.now();
    } else if (isGameResultMessage(data)) {
      console.log("dans gameresult");
      playerId = -1; // Reset player ID
      displayGameResult(data);
    } else if (isDisconnectionMessage(data)) {
      playerId = -1; // Reset player ID
      displayGameError(data);
    }
  } catch (error: any) {
    console.error("An Error occured:", error);
  }
}

let isRegisteredToGameMessages: boolean = false;

function registerToGameMessages(): void {
  if (!isRegisteredToGameMessages) {
    subscribeTo("game", handleGameMessages);
    isRegisteredToGameMessages = true;
  }
}

function unregisterToGameMessages(): void {
  if (isRegisteredToGameMessages) {
    unsubscribeTo("game", handleGameMessages);
    isRegisteredToGameMessages = false;
  }
}

function displayGameResult(gameResult: GameResultMessage): void {
  if (!isGameResultMessage(gameResult)) return;

  const overlay: HTMLDivElement = document.createElement("div");
  overlay.id = "game-result-screen";
  overlay.className = `
    fixed inset-0 bg-[#1e1b4b] bg-opacity-10 flex flex-col items-center justify-center text-white z-50 p-6 space-y-6
  `;

  const content: HTMLDivElement = document.createElement("div");
  content.className = `
    opacity-0 scale-90 transition-all duration-500 ease-out
    flex flex-col items-center text-white p-6 space-y-6
    bg-[#2a255c] rounded-xl shadow-2xl max-w-xl w-full
  `;

  const h2: HTMLElement = document.createElement("h2");
  h2.className = "text-4xl font-bold text-green-400 animate-bounce";
  h2.textContent = "🎉 Victoire de ";

  const spanWinner: HTMLSpanElement = document.createElement("span");
  spanWinner.className = "text-yellow-400";
  spanWinner.textContent = gameResult.winner;

  h2.appendChild(spanWinner);
  h2.append(" !");

  content.appendChild(h2);

  const tempWrapper: HTMLDivElement = document.createElement("div");
  tempWrapper.innerHTML = `
      <p class="text-xl">Score final : <span class="font-semibold">${gameResult.p1Score} / ${gameResult.p2Score}</span></p>
      <div class="bg-[#2a255c] p-4 rounded-lg shadow-lg w-full max-w-md">
        <h3 class="text-2xl font-semibold text-indigo-300 mb-4">Statistiques</h3>
        <ul class="space-y-2 text-sm">
          <li><span class="text-indigo-400 font-medium">game duration : </span>${Math.floor(Math.max(gameResult.gameStats.gameEndTime - gameResult.gameStats.gameStartTime, 0) / 1000)}s</li>
          <li><span class="text-indigo-400 font-medium">ball exchanges count : </span>${gameResult.gameStats.ballExchangesCount}</li>
          <li><span class="text-indigo-400 font-medium">ball collisions count : </span>${gameResult.gameStats.ballCollisionsCount}</li>
          <li><span class="text-indigo-400 font-medium">player 1 distance travelled : </span>${Math.floor(gameResult.gameStats.paddle1DistanceTravelled * 10) / 10}m</li>
          <li><span class="text-indigo-400 font-medium">player 2 distance travelled : </span>${Math.floor(gameResult.gameStats.paddle2DistanceTravelled * 10) / 10}m</li>
        </ul>
      </div>
      <button id="back-to-menu" class="mt-4 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition">
        Retour au menu
      </button>
`;
  while (tempWrapper.firstChild) {
    content.appendChild(tempWrapper.firstChild);
  }

  overlay.appendChild(content);
  document.body.appendChild(overlay);
  console.log("[DEBUG] overlay ajouté au DOM");

  requestAnimationFrame(() => {
    content.classList.remove("opacity-0", "scale-90");
    content.classList.add("opacity-100", "scale-100");
  });

  const backToMenu: HTMLButtonElement | null = document.getElementById(
    "back-to-menu",
  ) as HTMLButtonElement;
  if (!backToMenu) return;

  backToMenu.addEventListener("click", () => {
    BackToMenu();
  });
}

function deleteGameResult(): void {
  const gameResult: HTMLElement | null =
    document.getElementById("game-result-screen");
  if (gameResult) {
    gameResult.remove();
  }
}

function displayGameError(errorMessage: DisconnectionMessage): void {
  // TODO: display a screen with {error_type} and a 'Back to menu' button
  if (isDisconnectionMessage(errorMessage)) {
    // error_type : 'the opponent disconnected'
    showErrorToast("L'adversaire a été déconnecté");
  } /*else if () {
    // other error types
  }*/

  BackToMenu();
}

// Update the ball and paddles meshes positions
function updateAllPositions(): void {
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
}

let localGamePlaying: boolean = false;
let previousPaddle1Position: BABYLON.Vector2 = new BABYLON.Vector2(0, GAME_CONSTANT.paddleDefaultZPosition);
let previousPaddle2Position: BABYLON.Vector2 = new BABYLON.Vector2(0, -GAME_CONSTANT.paddleDefaultZPosition);

// Reset the game and all position
function resetGame(): void {
  gameData = newGameData();
  gameStats = newGameStats();

  previousPaddle1Position = new BABYLON.Vector2(0, GAME_CONSTANT.paddleDefaultZPosition);
  previousPaddle2Position = new BABYLON.Vector2(0, -GAME_CONSTANT.paddleDefaultZPosition);

  updateAllPositions();

  resetBall(gameData.ball);
  updateScoreText();
}

// The function handling the local game loop
function gameLoop(deltaTime: number): void {
  if (!localGamePlaying && currentGameMode !== GameMode.MENU) return;

  gameStats.paddle1DistanceTravelled += BABYLON.Vector2.Distance(gameData.paddle1Position, previousPaddle1Position);
  previousPaddle1Position = new BABYLON.Vector2(gameData.paddle1Position.x, gameData.paddle1Position.y);
  gameStats.paddle2DistanceTravelled += BABYLON.Vector2.Distance(gameData.paddle2Position, previousPaddle2Position);
  previousPaddle2Position = new BABYLON.Vector2(gameData.paddle2Position.x, gameData.paddle2Position.y);

  const previousP1Score: number = gameData.p1Score;
  const previousP2Score: number = gameData.p2Score;
  updateBallPosition(gameData, gameStats, deltaTime, ballMesh);

  if (
    previousP1Score !== gameData.p1Score ||
    previousP2Score !== gameData.p2Score
  ) {
    updateScoreText();
  }

  // Show a game result only in SINGLEPLAYER or LOCAL mode
  if (
    currentGameMode === GameMode.SINGLEPLAYER ||
    currentGameMode === GameMode.LOCAL
  ) {
    if (
      gameData.p1Score >= GAME_CONSTANT.defaultScoreToWin ||
      gameData.p2Score >= GAME_CONSTANT.defaultScoreToWin
    ) {
      localGamePlaying = false;
      gameStats.gameEndTime = Date.now();

      const gameResult: GameResultMessage = {
        type: "gameResult",
        p1Score: gameData.p1Score,
        p2Score: gameData.p2Score,
        winnerUUID: "",
        winner: gameData.p1Score > gameData.p2Score ? "Player 1" : "Player 2",
        gameStats,
      };
      displayGameResult(gameResult);
    }
  }
}

// Babylon.js setup
export async function initGameEnvironment(): Promise<void> {
  if (!canvas) {
    throw new Error(
      "Canvas element is not created. Call CreateGameCanvas() first.",
    );
  }
  if (engine) {
    engine.dispose(); // Dispose of the previous engine if it exists
  }

  engine = new BABYLON.Engine(canvas, true); // Initialize the Babylon.js engine

  scene = new BABYLON.Scene(engine); // Create a new scene
  scene.clearColor = new BABYLON.Color4(0.53, 0.8, 0.92, 1);

  camera = new BABYLON.ArcRotateCamera(
    "Camera",
    0, // Horizontal rotation
    0, // Vertical rotation
    10, // Distance from target
    new BABYLON.Vector3(0, 0, 0), // Target position
    scene,
  );
  camera.attachControl(canvas as HTMLElement, false);

  updateCameraMode(camera);

  // Create an hemispheric light
  light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene,
  );
  light.intensity = 1.0;

  const environmentSceneLoadingStateIndex: number =
    loadingHandler.addLoadingState();

  // Load the environment scene
  try {
    BABYLON.ImportMeshAsync("/api/models/scene.glb", scene, {
      pluginExtension: ".glb",
    })
      .then((result: BABYLON.ISceneLoaderAsyncResult) => {
        disableSpecularOnMeshes(result.meshes);

        const sceneMesh: BABYLON.Mesh = result.meshes[0] as BABYLON.Mesh; // Get the root of the model
        sceneMesh.position = new BABYLON.Vector3(0, 0, 0);
        sceneMesh.rotation = new BABYLON.Vector3(0, 0, 0);
        //sceneMesh.isPickable = false;
      })
      .catch((error: any) => {
        console.error(
          "An error occurred while loading model 'scene.glb' :",
          error,
        );
      })
      .finally(() =>
        loadingHandler.setLoaded(environmentSceneLoadingStateIndex),
      );
    //}).finally(() => setTimeout(() => loadingHandler.setLoaded(environmentSceneLoadingStateIndex), 5000)); // Delay of 5s for testing purposes
  } catch (error: any) {
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

  const groundTextureLoadingStateIndex: number =
    loadingHandler.addLoadingState();
  const groundTextureLoadedCallback: () => void = () =>
    loadingHandler.setLoaded(groundTextureLoadingStateIndex);

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
    },
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
  function createScoreDisplay(
    suffix: "Top" | "Bottom",
  ): BABYLON.DynamicTexture {
    const scoreFontTexture: BABYLON.DynamicTexture = new BABYLON.DynamicTexture(
      "scoreFontTexture" + suffix,
      { width: 512, height: 128 },
      scene,
      true,
    );

    const scorePlane: BABYLON.Mesh = BABYLON.MeshBuilder.CreatePlane(
      "scorePlane" + suffix,
      { width: 4, height: 1 },
      scene,
    );
    const side: -1 | 1 = suffix === "Bottom" ? -1 : 1;
    scorePlane.position = new BABYLON.Vector3(3.6 * side, 0, 0);
    scorePlane.rotation = new BABYLON.Vector3(
      Math.PI / 2,
      (Math.PI / 2) * side,
      0,
    );

    const scoreMaterial: BABYLON.StandardMaterial =
      new BABYLON.StandardMaterial("scoreMaterial" + suffix, scene);
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
          deltaTime,
        );

        handleAIInput(
          gameData.paddle2Position,
          paddle2Mesh,
          gameData.ball,
          deltaTime,
        );

        camera.alpha += GAME_CONSTANT.cameraRotationSpeed * deltaTime;
        gameLoop(deltaTime);
        break;

      case GameMode.SINGLEPLAYER:
        handlePlayerInput(
          gameData.paddle1Position,
          paddle1Mesh,
          paddle1Input,
          paddle1DraggingData,
          deltaTime,
        );

        handleAIInput(
          gameData.paddle2Position,
          paddle2Mesh,
          gameData.ball,
          deltaTime,
        );

        gameLoop(deltaTime);
        break;

      case GameMode.LOCAL:
        handlePlayerInput(
          gameData.paddle1Position,
          paddle1Mesh,
          paddle1Input,
          paddle1DraggingData,
          deltaTime,
        );

        handlePlayerInput(
          gameData.paddle2Position,
          paddle2Mesh,
          paddle2Input,
          paddle2DraggingData,
          deltaTime,
        );

        gameLoop(deltaTime);
        break;

      case GameMode.ONLINE:
        if (playerId === 1 || playerId === 2) {
          const isPlayer1: boolean = playerId === 1;
          const paddleDraggingData: PaddleDraggingData = isPlayer1
              ? paddle1DraggingData
              : paddle2DraggingData;

          if (paddle1Input !== 0 || paddleDraggingData.pointerId !== -1) {
            const pos: BABYLON.Vector2 = isPlayer1
              ? gameData.paddle1Position
              : gameData.paddle2Position;
            handlePlayerInput(
              pos,
              isPlayer1 ? paddle1Mesh : paddle2Mesh,
              isPlayer1 ? paddle1Input : ~paddle1Input, // If we are the 2e player inverse the input since the view is inverted
              paddleDraggingData,
              deltaTime,
            );

            const now: number = performance.now();
            if (now - lastSendTime >= sendRateInterval) {
              lastSendTime = now;

              // Send the local paddle position to the server
              const paddleData: PaddlePositionMessage = {
                type: "paddlePosition",
                position: new BABYLON.Vector2(pos.x, pos.y),
              };
              sendMessage("game", paddleData);
            }
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

  // Wait for the game environment to be fully loaded before showing the canvas
  // and return a promise that resolves when the loading is complete
  return new Promise<void>((resolve) => {
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

export function LoadGameCanvasIfNeeded(): void {
  if (location.pathname !== "/") {
    navigateTo("/"); // Go to root if not already there
  }
}

// Send a leave message to server if needed, and set 'currentGameMode' to MENU
export function LeaveGameIfNeeded(): void {
  localGamePlaying = false;
  deleteGameResult();

  if (currentGameMode === GameMode.ONLINE || currentGameMode === GameMode.SPECTATING) {
    // Tell the server we quit the game
    const LeaveGameMessage: LeaveGameMessage = {
      type: "leaveGame",
    };
    sendMessage("game", LeaveGameMessage);
  }
  currentGameMode = GameMode.MENU;
}

// Quit the game and go back to the menu
export function BackToMenu(): void {
  LeaveGameIfNeeded();

  currentGameMode = GameMode.MENU;
  updateCameraMode(camera);
  unregisterToGameMessages();
  showGameModeSelectionMenu();

  resetGame();

  showSkinSelector();
  setPaddleSkin(1, "");
  setPaddleSkin(2, "");
}

// Launch the game in single player against an AI opponent
export function SinglePlayer(): void {
  LeaveGameIfNeeded();

  currentGameMode = GameMode.SINGLEPLAYER;
  updateCameraMode(camera);
  unregisterToGameMessages();
  hideGameModeSelectionMenu();

  resetGame();

  hideSkinSelector();
  setPaddleSkin(1, getSelectedSkinId());
  setPaddleSkin(2, "");

  localGamePlaying = true;
  gameStats.gameStartTime = Date.now();
}

// Launch the game in local 1v1 mode
export function LocalGame(): void {
  LeaveGameIfNeeded();

  currentGameMode = GameMode.LOCAL;
  updateCameraMode(camera);
  unregisterToGameMessages();
  hideGameModeSelectionMenu();

  resetGame();

  hideSkinSelector();
  setPaddleSkin(1, getSelectedSkinId());
  setPaddleSkin(2, getSelectedSkinId());

  localGamePlaying = true;
  gameStats.gameStartTime = Date.now();
}

// Launch the game in online mode against a remote player
export function OnlineGame(autoMatchmaking: boolean = true): void {
  if (!isConnected()) {
    console.error(
      "You are not connected to the server, cannot start an online game",
    );
    showErrorToast("Vous n'êtes pas connecté au serveur, vous ne pouvez pas démarrer une partie en ligne");
    return;
  }
  LoadGameCanvasIfNeeded();
  deleteGameResult();
  localGamePlaying = false;

  currentGameMode = GameMode.ONLINE;
  updateCameraMode(camera);
  hideGameModeSelectionMenu();

  resetGame();

  hideSkinSelector();
  localSkinId = getSelectedSkinId();
  setPaddleSkin(1, localSkinId);

  registerToGameMessages();
  if (autoMatchmaking) {
    sendMessage("game", { type: "matchmaking" } as MatchmakingMessage);
  }
}

(window as any).SpectatingMode = SpectatingMode; ///////////////////////////////////////////////////////
// Launch the game in spectating mode to watch match of other remote players
export function SpectatingMode(playerUUIDToSpectate: string): void {
  if (!isConnected()) {
    console.error(
      "You are not connected to the server, cannot spectate other game",
    );
    showErrorToast("Vous n'êtes pas connecté au serveur, vous ne pouvez pas démarrer une partie en ligne");
    return;
  }
  LoadGameCanvasIfNeeded();
  deleteGameResult();
  localGamePlaying = false;

  currentGameMode = GameMode.SPECTATING;
  updateCameraMode(camera);
  hideGameModeSelectionMenu();

  resetGame();

  hideSkinSelector();

  playerId = -1;
  registerToGameMessages();

  const spectatingRequest: SpectatingRequestMessage = {
    type: "spectatingRequest",
    target: playerUUIDToSpectate
  };
  sendMessage("game", spectatingRequest);
}

// Setup the game to replay mode
export function ReplayMode(p1Skin: string, p2Skin: string): void {
  deleteGameResult();
  localGamePlaying = false;

  currentGameMode = GameMode.REPLAY;
  updateCameraMode(camera);
  // TODO: show a menu to come back before if a 'replay' button was pressed
  //       else send back to '/'

  resetGame();

  setPaddleSkin(1, p1Skin);
  setPaddleSkin(2, p2Skin);
}

export function SetReplayGameData(
  positionData: PositionData | undefined,
  scoreData: ScoreData | undefined,
): void {
  if (currentGameMode !== GameMode.REPLAY) {
    return;
  }

  if (positionData) {
    gameData.ball.position.x = positionData[0][0];
    gameData.ball.position.y = positionData[0][1];
    gameData.paddle1Position.x = positionData[1][0];
    gameData.paddle1Position.y = positionData[1][1];
    gameData.paddle2Position.x = positionData[2][0];
    gameData.paddle2Position.y = positionData[2][1];
    updateAllPositions();
  }

  if (scoreData) {
    if (
      gameData.p1Score !== scoreData[0] ||
      gameData.p2Score !== scoreData[1]
    ) {
      gameData.p1Score = scoreData[0];
      gameData.p2Score = scoreData[1];
      updateScoreText();
    }
  }
}

//////// DEBUG ONLY

// let axesViewer: BABYLON.AxesViewer | null = null;

// // Function to enable or disable the AxesViewer
// function ToggleAxesViewer(size: number = 1): void {
//   if (!scene) {
//     return;
//   }
//   if (axesViewer) {
//     axesViewer.dispose();
//     axesViewer = null;
//     console.log("AxesViewer disabled.");
//   } else {
//     axesViewer = new BABYLON.AxesViewer(scene, size);
//     console.log("AxesViewer enabled.");
//   }
// }
// // Expose the function to the console
// (window as any).ToggleAxesViewer = ToggleAxesViewer;
