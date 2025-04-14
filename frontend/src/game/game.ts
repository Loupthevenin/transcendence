import { BABYLON, GAME_CONSTANT, GameData, newGameData } from "@shared/game/gameElements";
import { updateBallPosition, resetBall } from "@shared/game/ball";
import { SkinChangeMessage, isSkinChangeMessage, PaddlePositionMessage, isGameStartedMessage, isGameDataMessage, isGameResultMessage, isDisconnectionMessage } from "@shared/game/gameMessage";
import { showSkinSelector, hideSkinSelector, getSelectedSkinId } from "./skinSelector";
import { createDefaultSkin, loadPadddleSkin } from "./paddleSkinLoader";

enum GameMode {
  MENU,         // Player is in the menu
  SINGLEPLAYER, // Singleplayer mode
  LOCAL,        // Local multiplayer mode
  ONLINE        // Online multiplayer mode
}

let currentGameMode: GameMode = GameMode.MENU;

let canvas: HTMLCanvasElement | null = null;

export function createGameCanvas() : HTMLCanvasElement {
  // If a canvas already exists, remove it
  if (canvas) {
    canvas.remove();
    canvas = null;
  }

  canvas = document.createElement("canvas");
  canvas.id = "renderCanvas";

  canvas.className = "absolute top-0 left-0 w-full h-full z-10";

  return canvas;
}

let engine: BABYLON.Engine;
let scene: BABYLON.Scene;
let camera: BABYLON.ArcRotateCamera;
let light: BABYLON.HemisphericLight;

// Update camera rotation based on game mode
function updateCameraRotation(camera: BABYLON.ArcRotateCamera, gameMode: GameMode) : void {
  if (!camera) {
    return;
  }

  switch (gameMode) {
    case GameMode.MENU:
      camera.alpha = BABYLON.Tools.ToRadians(180); // Horizontal rotation
      camera.beta = BABYLON.Tools.ToRadians(50); // Vertical rotation
      break;
    case GameMode.ONLINE:
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

function updateScoreText() : void {
  function updateScoreFontTexture(fontTexture: BABYLON.DynamicTexture, leftScore: number, rightScore: number) : void {
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

interface PaddleDraggingData {
  pointerId: number,
  targetX: number | null
}

let paddle1DraggingData: PaddleDraggingData;
let paddle2DraggingData: PaddleDraggingData;

// Function to handle player input and update paddle position
function handlePlayerInput(paddlePosition: BABYLON.Vector2, paddleMesh: BABYLON.Mesh, keyInput: number, draggingData: PaddleDraggingData, deltaTime: number) : void {
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

// Function to handle player drag input
function handlePlayerDragInput(pointerInfo: BABYLON.PointerInfo) : void {
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

function setPaddleSkin(paddle: 1 | 2, skinId: number) : void {
  if (paddle === 1) {
    // Create a temporary mesh will waiting for server response if there is no mesh
    if (!paddle1Mesh) {
      paddle1Mesh = createDefaultSkin(scene);
    }
    loadPadddleSkin(skinId, scene).then((mesh: BABYLON.Mesh) => {
      if (paddle1Mesh) {
        paddle1Mesh.dispose(); // Delete the temporary mesh
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
        paddle2Mesh.dispose(); // Delete the temporary mesh
      }
      paddle2Mesh = mesh;
      mesh.position = new BABYLON.Vector3(0, GAME_CONSTANT.paddleDepth / 2, -GAME_CONSTANT.paddleDefaultZPosition);
      mesh.rotation = new BABYLON.Vector3(0, Math.PI, 0);
    });
  }
}

let socket: WebSocket | null = null; // WebSocket connection to the server
let playerId: -1 | 1 | 2 = -1; // Player ID (1 or 2) to identify which paddle the player controls
let localSkinId: number = -1;

// Function to close the WebSocket connection
function closeSocket() : void {
  if (socket) {
    socket.close();
    socket = null;
  }
}

// Function to connect to the WebSocket server
function connectToServer(oncloseCallback?: () => void) : WebSocket {
  // Dynamically construct the WebSocket URL to avoid hardcoding
  const wsProtocol: string = window.location.protocol === 'https:' ? 'wss://' : 'ws://'; // Use 'wss' for secure, 'ws' for non-secure
  const wsHost: string = window.location.host; // Get the domain and port (e.g., "example.com:443" or "localhost:8080")
  const wsPath: string = '/api/'; // The WebSocket endpoint path on the server

  const wsUrl: string = `${wsProtocol}${wsHost}${wsPath}`;
  const ws: WebSocket = new WebSocket(wsUrl);

  // Handle connection open
  ws.onopen = () => {
      console.log('Connected to WebSocket: ', wsUrl);
  };

  // Handle incoming messages
  ws.onmessage = (event: MessageEvent) => {
      //console.log('Received:', JSON.parse(event.data));
      try {
          const data: any = JSON.parse(event.data);

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
            ws.send(JSON.stringify(skinChangeMessage));
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
            if (data.winner === playerId) {
              console.log("You win!");
            } else {
              console.log("You lose!");
            }
            playerId = -1; // Reset player ID
          }
          else if (isDisconnectionMessage(data)) {
            console.log("The other player disconnected !");
          }
      }
      catch (error) {
        console.error('An Error occured:', error);
      }
  };

  // Handle close
  ws.onclose = () => {
      console.log('WebSocket connection closed.');
      if (oncloseCallback) {
        oncloseCallback();
      }
      playerId = -1; // Reset player ID
  };

  // Handle errors
  ws.onerror = (error) => {
      console.error('WebSocket error: ', error);
  };

  return ws;
}

// Reset the game and all position
function ResetGame() : void {
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
}

// Babylon.js setup
export function initGameEnvironment() : void {
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

  // Create the ground
  ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: GAME_CONSTANT.areaWidth, height: GAME_CONSTANT.areaHeight },
    scene,
  );
  ground.rotation.y = Math.PI / 2;
  const groundMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial(
    "groundMaterial",
    scene,
  );
  groundMaterial.specularColor = BABYLON.Color3.Black();
  groundMaterial.diffuseTexture = new BABYLON.Texture(
    "/api/textures/tennis_court.svg",
    scene,
    { samplingMode: BABYLON.Texture.NEAREST_SAMPLINGMODE },
  );
  ground.material = groundMaterial;

  // Create the paddles
  setPaddleSkin(1, 0);
  setPaddleSkin(2, 1);

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

  ///////////////////////////////////////////////////////////////
  //new BABYLON.AxesViewer(scene, 2);
  ///////////////////////////////////////////////////////////////

  // Create the top score display
  scoreFontTextureTop = new BABYLON.DynamicTexture(
    "scoreFontTextureTop",
    { width: 512, height: 128 },
    scene,
    true,
  );

  const scorePlaneTop: BABYLON.Mesh = BABYLON.MeshBuilder.CreatePlane(
    "scorePlaneTop",
    { width: 4, height: 1 },
    scene
  );
  scorePlaneTop.position = new BABYLON.Vector3(3.6, 0, 0);
  scorePlaneTop.rotation = new BABYLON.Vector3(Math.PI / 2, Math.PI / 2, 0);

  const scoreMaterialTop: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("scoreMaterialTop", scene);
  scoreMaterialTop.specularColor = BABYLON.Color3.Black();
  scoreMaterialTop.diffuseTexture = scoreFontTextureTop;
  scoreMaterialTop.opacityTexture = scoreFontTextureTop; // Enable transparency
  scoreMaterialTop.alpha = 1;

  scorePlaneTop.material = scoreMaterialTop;

  // Create the bottom score display
  scoreFontTextureBottom = new BABYLON.DynamicTexture(
    "scoreFontTextureBottom",
    { width: 512, height: 128 },
    scene,
    true,
  );

  const scorePlaneBottom: BABYLON.Mesh = BABYLON.MeshBuilder.CreatePlane(
    "scorePlaneBottom",
    { width: 4, height: 1 },
    scene
  );
  scorePlaneBottom.position = new BABYLON.Vector3(-3.6, 0, 0);
  scorePlaneBottom.rotation = new BABYLON.Vector3(Math.PI / 2, -Math.PI / 2, 0);

  const scoreMaterialBottom: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("scoreMaterialBottom", scene);
  scoreMaterialBottom.specularColor = BABYLON.Color3.Black();
  scoreMaterialBottom.diffuseTexture = scoreFontTextureBottom;
  scoreMaterialBottom.opacityTexture = scoreFontTextureBottom; // Enable transparency
  scoreMaterialBottom.alpha = 1;

  scorePlaneBottom.material = scoreMaterialBottom;

  updateScoreText();

  // Setup up dragging data
  paddle1DraggingData = { pointerId: -1, targetX: null };
  paddle2DraggingData = { pointerId: -1, targetX: null };
  scene.onPointerObservable.add(handlePlayerDragInput);

  //let lastUpdateTime: number = performance.now(); // For client prediction timing

  // Game render loop
  engine.runRenderLoop(() => {
    const deltaTime: number = engine.getDeltaTime() / 1000; // Get the delta time as seconds (default milliseconds)

    switch (currentGameMode) {
      case GameMode.MENU:
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

        // TODO: AI paddle

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
            const pos: BABYLON.Vector2 = playerId === 1 ? gameData.paddle1Position : gameData.paddle2Position;
            handlePlayerInput(
              pos,
              playerId === 1 ? paddle1Mesh : paddle2Mesh,
              playerId === 1 ? paddle1Input : ~paddle1Input, // if we are the 2e player inverse the input
              playerId === 1 ? paddle1DraggingData : paddle2DraggingData,
              deltaTime
            )

            // Send new paddle position to the server
            const paddleData: PaddlePositionMessage = {
              type: "paddlePosition",
              position: new BABYLON.Vector2(pos.x, pos.y)
            };

            if (socket) {
              socket.send(JSON.stringify(paddleData));
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
}

// Quit the game and go back to the menu
export function BackToMenu() : void {
  currentGameMode = GameMode.MENU;
  updateCameraRotation(camera, currentGameMode);
  closeSocket();

  ResetGame();

  showSkinSelector();
  setPaddleSkin(1, 0);
  setPaddleSkin(2, 1);
}

// Launch the game in single player against an AI opponent
export function SinglePlayer() : void {
  currentGameMode = GameMode.SINGLEPLAYER;
  updateCameraRotation(camera, currentGameMode);
  closeSocket();

  ResetGame();

  hideSkinSelector();
  setPaddleSkin(1, getSelectedSkinId());
  setPaddleSkin(2, 1);
}

// Launch the game in local 1v1 mode
export function LocalGame() : void {
  currentGameMode = GameMode.LOCAL;
  updateCameraRotation(camera, currentGameMode);
  closeSocket();

  ResetGame();

  hideSkinSelector();
  setPaddleSkin(1, getSelectedSkinId());
  setPaddleSkin(2, getSelectedSkinId());
}

// Launch the game in online mode against a remote player
export function OnlineGame() : void {
  currentGameMode = GameMode.ONLINE;
  updateCameraRotation(camera, currentGameMode);
  closeSocket();

  ResetGame();

  hideSkinSelector();
  localSkinId = getSelectedSkinId();
  setPaddleSkin(1, localSkinId);

  socket = connectToServer(() => {
    socket = null;
    if (currentGameMode == GameMode.ONLINE) {
      BackToMenu();
    }
  });
}

//// TO DELETE //// TO DELETE //// TO DELETE //// TO DELETE ////
////////////////////////////////////////////////////////////////
(window as any).BackToMenu = BackToMenu;
(window as any).SinglePlayer = SinglePlayer;
(window as any).LocalGame = LocalGame;
(window as any).OnlineGame = OnlineGame;
////////////////////////////////////////////////////////////////