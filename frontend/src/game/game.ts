import { BABYLON, GAME_CONSTANT, GameData, PlayerPaddle as PaddleData } from "@shared/game/gameElements";
//import { updateBallPosition, resetBall } from "@shared/game/ball";

export function CreateGameCanvas() : HTMLCanvasElement {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.id = "renderCanvas";

  canvas.className = "absolute top-0 left-0 w-full h-full z-10";

  return canvas;
}

// Babylon.js setup
export function InitGame() : void {
  const canvas: HTMLElement | null = document.getElementById("renderCanvas"); // Get the canvas element

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error(
      "renderCanvas is not a valid HTMLCanvasElement or is null. Stopping execution.",
    );
  }

  const engine: BABYLON.Engine = new BABYLON.Engine(canvas, true); // Initialize the Babylon.js engine

  const scene: BABYLON.Scene = new BABYLON.Scene(engine); // Create a new scene
  scene.detachControl(); // Detach control to prevent user interaction

  const camera: BABYLON.ArcRotateCamera = new BABYLON.ArcRotateCamera(
    "Camera",
    Math.PI, // Horizontal rotation
    0, // Vertical rotation
    10, // Distance from target
    new BABYLON.Vector3(0, 0, 0), // Target position
    scene,
  );

  camera.attachControl(canvas as HTMLElement, false); // Attach to the canvas without user controls
  camera.lowerAlphaLimit = camera.alpha; // Lock horizontal rotation
  camera.upperAlphaLimit = camera.alpha;
  camera.lowerBetaLimit = camera.beta; // Lock vertical rotation
  camera.upperBetaLimit = camera.beta;
  camera.lowerRadiusLimit = camera.radius; // Lock zoom
  camera.upperRadiusLimit = camera.radius;

  const gameData: GameData = {
    ball: {
      position: new BABYLON.Vector2(0, 0),
      velocity: new BABYLON.Vector2(0, 0)
    },
    paddle1Position: new BABYLON.Vector2(0, GAME_CONSTANT.paddleDefaultYPosition),
    paddle2Position: new BABYLON.Vector2(0, -GAME_CONSTANT.paddleDefaultYPosition),
    p1Score: 0,
    p2Score: 0,
  };

  // Create the paddle
  const paddle1Mesh: BABYLON.Mesh = BABYLON.MeshBuilder.CreateBox(
    "paddle1",
    {
      width: GAME_CONSTANT.paddleWidth,
      height: GAME_CONSTANT.paddleDepth,
      depth: GAME_CONSTANT.paddleDepth
    },
    scene,
  );
  paddle1Mesh.position = new BABYLON.Vector3(0, 0, GAME_CONSTANT.paddleDefaultYPosition);

  const paddle2Mesh: BABYLON.Mesh = BABYLON.MeshBuilder.CreateBox(
    "paddle2",
    {
      width: GAME_CONSTANT.paddleWidth,
      height: GAME_CONSTANT.paddleDepth,
      depth: GAME_CONSTANT.paddleDepth
    },
    scene,
  );
  paddle2Mesh.position = new BABYLON.Vector3(0, 0, -GAME_CONSTANT.paddleDefaultYPosition);

  const paddleMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial(
    "paddleMaterial",
    scene,
  );
  paddleMaterial.emissiveColor = BABYLON.Color3.Black();

  paddle1Mesh.material = paddleMaterial;
  paddle2Mesh.material = paddleMaterial;

  // Create the ball
  const ballMesh: BABYLON.Mesh = BABYLON.MeshBuilder.CreateSphere(
    "ball",
    { diameter: GAME_CONSTANT.ballRadius * 2 },
    scene,
  );
  ballMesh.position = new BABYLON.Vector3(0, GAME_CONSTANT.ballRadius, 0);
  const ballMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial(
    "ballMaterial",
    scene,
  );
  ballMaterial.emissiveColor = BABYLON.Color3.Gray();
  ballMesh.material = ballMaterial;

  // Create the ground
  const ground: BABYLON.GroundMesh = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: GAME_CONSTANT.areaWidth, height: GAME_CONSTANT.areaHeight },
    scene,
  );
  ground.rotation.y = Math.PI / 2;
  const groundMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial(
    "groundMaterial",
    scene,
  );
  groundMaterial.emissiveTexture = new BABYLON.Texture(
    "./assets/tennis_court.svg",
    scene,
    { samplingMode: BABYLON.Texture.NEAREST_SAMPLINGMODE },
  );
  ground.material = groundMaterial;

  ///////////////////////////////////////////////////////////////
  //new BABYLON.AxesViewer(scene, 2);
  ///////////////////////////////////////////////////////////////

  // Create the score display
  const scoreFontTexture: BABYLON.DynamicTexture = new BABYLON.DynamicTexture(
    "fontTexture",
    { width: 256, height: 128 },
    scene,
    true,
  );

  function updateScoreText() : void {
    scoreFontTexture.clear();

    const text: string = `${gameData.p1Score} : ${gameData.p2Score}`;
    const fontSize: number = 80; // Font size in pixels
    const font: string = `bold ${fontSize}px Arial`;

    // Set the font on the dynamic texture
    scoreFontTexture.drawText("", 0, 0, font, "white", "transparent"); // Needed to set the font size
  
    // Get the 2D context of the DynamicTexture
    const context: BABYLON.ICanvasRenderingContext = scoreFontTexture.getContext();
    context.font = font;

    // Measure the text dimensions
    const textMetrics: BABYLON.ITextMetrics = context.measureText(text);
    const textWidth: number = textMetrics.width;

    // Calculate the centered position
    const textureWidth: number = scoreFontTexture.getSize().width;
    const textureHeight: number = scoreFontTexture.getSize().height;
    const x: number = (textureWidth - textWidth) / 2; // Center horizontally
    const y: number = (textureHeight + fontSize) / 2; // Center vertically

    // Draw the text centered
    scoreFontTexture.drawText(text, x, y, font, "white", "transparent");
  }

  updateScoreText();

  const scoreMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial("scoreMaterial", scene);
  scoreMaterial.emissiveTexture = scoreFontTexture;
  scoreMaterial.opacityTexture = scoreFontTexture; // Enable transparency
  scoreMaterial.alpha = 1;

  const scorePlane: BABYLON.Mesh = BABYLON.MeshBuilder.CreatePlane(
    "scorePlane",
    { width: 2.4, height: 1.2 },
    scene
  );
  scorePlane.material = scoreMaterial;
  scorePlane.position = new BABYLON.Vector3(3.6, 0, 0);
  scorePlane.rotation = new BABYLON.Vector3(Math.PI / 2, Math.PI / 2, 0);

  // Update function to refresh scores
  scene.onBeforeRenderObservable.add(() => {
    updateScoreText();
  });

  // Paddle movement variables
  let paddle1Input: number = 0;
  //let paddle2Input: number = 0;

  // Add input handling for paddle movement
  window.addEventListener("keydown", (event: KeyboardEvent) => {
    switch (event.key) {
      case "w": // Move Paddle 1 (Player 1) Up
        paddle1Input |= 0b01;
        break;
      case "s": // Move Paddle 1 (Player 1) Down
        paddle1Input |= 0b10;
        break;
      // case "ArrowUp": // Move Paddle 2 (Player 2) Up
      //   paddle2Input |= 0b01;
      //   break;
      // case "ArrowDown": // Move Paddle 2 (Player 2) Down
      //   paddle2Input |= 0b10;
      //   break;
    }
  });

  window.addEventListener("keyup", (event: KeyboardEvent) => {
    switch (event.key) {
      case "w":
        paddle1Input &= ~0b01; // Stop Paddle 1 Up movement
        break;
      case "s":
        paddle1Input &= ~0b10; // Stop Paddle 1 Down movement
        break;
      // case "ArrowUp":
      //   paddle2Input &= ~0b01; // Stop Paddle 2 Up movement
      //   break;
      // case "ArrowDown":
      //   paddle2Input &= ~0b10; // Stop Paddle 2 Down movement
      //   break;
    }
  });

  let playerId: number = 0; // Player ID (1 or 2) to identify which paddle the player controls

  //let lastUpdateTime = performance.now(); // For client prediction timing

  function connectToServer() : WebSocket {
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
    ws.onmessage = (event) => {
        //console.log('Received:', JSON.parse(event.data));

        try {
            const data: any = JSON.parse(event.data);

            if (data.type === "gameStarted") {
              playerId = data.id; // Set the player ID based on the server response
            }
            else if (data.type === "gameData") {
              const serverGameData: GameData = data.data as GameData;

              // Update game data with the received data
              gameData.ball.position = serverGameData.ball.position;
              if (playerId !== 1) {
                gameData.paddle1Position = serverGameData.paddle1Position;
              }
              if (playerId !== 2) {
                gameData.paddle2Position = serverGameData.paddle2Position;
              }

              if (gameData.p1Score !== serverGameData.p1Score || gameData.p2Score !== serverGameData.p2Score) {
                gameData.p1Score = serverGameData.p1Score;
                gameData.p2Score = serverGameData.p2Score;
                updateScoreText();
              }

              // Update the ball mesh position
              ballMesh.position.x = gameData.ball.position.x;
              ballMesh.position.z = gameData.ball.position.y;

              // Update the paddle mesh positions
              paddle1Mesh.position.x = gameData.paddle1Position.x;
              paddle1Mesh.position.z = gameData.paddle1Position.y;
              paddle2Mesh.position.x = gameData.paddle2Position.x;
              paddle2Mesh.position.z = gameData.paddle2Position.y;

              //lastUpdateTime = performance.now();
            }
            else if (data.type === "gameResult") {
              if ((data.winner as number) === playerId) {
                console.log("You win!");
              } else {
                console.log("You lose!");
              }
              playerId = 0; // Reset player ID
            }
            else if (data.type === "disconnected") {
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
        playerId = 0; // Reset player ID
    };

    // Handle errors
    ws.onerror = (error) => {
        console.error('WebSocket error: ', error);
    };

    return ws;
  }

  const ws: WebSocket = connectToServer();

  // Game render loop
  engine.runRenderLoop(() => {
    const deltaTime: number = engine.getDeltaTime() / 1000; // Get the delta time as seconds (default milliseconds)

    if (playerId === 1 || playerId === 2) {
      if (paddle1Input !== 0) {
        const pos: BABYLON.Vector2 = playerId === 1 ? gameData.paddle1Position : gameData.paddle2Position;
        // Update paddle positions
        pos.x += ((paddle1Input & 0b1) - ((paddle1Input >> 1) & 0b1)) * GAME_CONSTANT.paddleSpeed * deltaTime;

        // Clamp paddle positions to prevent them from going out of bounds
        pos.x = Math.min(
          Math.max(pos.x, GAME_CONSTANT.areaMinX + GAME_CONSTANT.paddleHalfWidth),
          GAME_CONSTANT.areaMaxX - GAME_CONSTANT.paddleHalfWidth,
        );

        // Update paddle mesh positions
        (playerId === 1 ? paddle1Mesh : paddle2Mesh).position.x = pos.x;

        // Send new paddle position to the server
        const paddleData: PaddleData = {
          position: new BABYLON.Vector2(pos.x, pos.y,)
        };

        ws.send(JSON.stringify(paddleData));
      }
    }

    // if (paddle2Input !== 0) {
    //   // Update paddle positions
    //   gameData.paddle2Position.x +=
    //     ((paddle2Input & 0b1) - ((paddle2Input >> 1) & 0b1)) * GAME_CONSTANT.paddleSpeed * deltaTime;

    //   // Clamp paddle positions to prevent them from going out of bounds
    //   gameData.paddle2Position.x = Math.min(
    //     Math.max(gameData.paddle2Position.x, GAME_CONSTANT.areaMinX + GAME_CONSTANT.paddleHalfWidth),
    //     GAME_CONSTANT.areaMaxX - GAME_CONSTANT.paddleHalfWidth,
    //   );

    //   // Update paddle mesh positions
    //   paddle2Mesh.position.x = gameData.paddle2Position.x;
    // }

    /*
    updateBallPosition(gameData, deltaTime);

    // Update ball mesh position of the ball
    ballMesh.position.x = gameData.ball.position.x;
    ballMesh.position.z = gameData.ball.position.y;
    */

    // Render the scene
    scene.render();
  });

  // Handle window resizing
  window.addEventListener("resize", () => {
    engine.resize();
  });
}
