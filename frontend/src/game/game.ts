import { BABYLON, GameState } from "@shared/gameElements";

export function CreateGameCanvas(): HTMLCanvasElement {
  const canvas: HTMLCanvasElement = document.createElement("canvas");
  canvas.id = "renderCanvas";

  canvas.className = "absolute top-0 left-0 w-full h-full z-10";

  return canvas;
}

// Babylon.js setup
export function InitGame() : undefined {
  const canvas = document.getElementById("renderCanvas"); // Get the canvas element

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error(
      "renderCanvas is not a valid HTMLCanvasElement or is null. Stopping execution.",
    );
  }

  const engine: BABYLON.Engine = new BABYLON.Engine(canvas, true); // Initialize the Babylon.js engine

  const scene: BABYLON.Scene = new BABYLON.Scene(engine); // Create a new scene
  // scene.detachControl(); // Detach control to prevent user interaction

  const camera: BABYLON.ArcRotateCamera = new BABYLON.ArcRotateCamera(
    "Camera",
    Math.PI, // Horizontal rotation
    0, // Vertical rotation
    10, // Distance from target
    new BABYLON.Vector3(0, 0, 0), // Target position
    scene,
  );

  camera.attachControl(canvas as unknown as HTMLElement, false); // Attach to the canvas without user controls
  // camera.lowerAlphaLimit = camera.alpha; // Lock horizontal rotation
  // camera.upperAlphaLimit = camera.alpha;
  // camera.lowerBetaLimit = camera.beta; // Lock vertical rotation
  // camera.upperBetaLimit = camera.beta;
  camera.lowerRadiusLimit = camera.radius; // Lock zoom
  camera.upperRadiusLimit = camera.radius;

  const gameState: GameState = {
    ballPosition: new BABYLON.Vector2(0, 0),
    paddle1Position: new BABYLON.Vector2(0, 0),
    paddle2Position: new BABYLON.Vector2(0, 0),
    p1Score: 0,
    p2Score: 0,
  };

  // Game settings
  const areaWidth: number = 10; // Width of the game area
  const areaHeight: number = 6; // Height of the game area

  const paddleWidth: number = 1; // Width of the paddles
  const paddleDepth: number = 0.1; // Depth of the paddles
  const paddleSpeed: number = 5; // Speed of paddle movement

  const ballRadius: number = 0.1; // The radius of the ball
  const ballSpeed: number = 5;
  let ballVelocity: BABYLON.Vector2 = new BABYLON.Vector2(0, 0);

  // Create the paddle
  const paddle1: BABYLON.Mesh = BABYLON.MeshBuilder.CreateBox(
    "paddle1",
    { width: paddleWidth, height: paddleDepth, depth: paddleDepth },
    scene,
  );
  paddle1.position = new BABYLON.Vector3(0, 0, -(areaWidth / 2 - 1));

  const paddle2: BABYLON.Mesh = BABYLON.MeshBuilder.CreateBox(
    "paddle2",
    { width: paddleWidth, height: paddleDepth, depth: paddleDepth },
    scene,
  );
  paddle2.position = new BABYLON.Vector3(0, 0, areaWidth / 2 - 1);

  const paddleMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial(
    "paddleMaterial",
    scene,
  );
  paddleMaterial.emissiveColor = BABYLON.Color3.Black();

  paddle1.material = paddleMaterial;
  paddle2.material = paddleMaterial;

  // Create the ball
  const ball: BABYLON.Mesh = BABYLON.MeshBuilder.CreateSphere(
    "ball",
    { diameter: ballRadius * 2 },
    scene,
  );
  ball.position = new BABYLON.Vector3(0, ballRadius, 0);
  const ballMaterial: BABYLON.StandardMaterial = new BABYLON.StandardMaterial(
    "ballMaterial",
    scene,
  );
  ballMaterial.emissiveColor = BABYLON.Color3.Gray();
  ball.material = ballMaterial;

  // Create the ground
  const ground = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: areaWidth, height: areaHeight },
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

  function updateScoreText() : undefined {
    scoreFontTexture.clear();

    const text: string = `${gameState.p1Score} : ${gameState.p2Score}`;
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

  const scorePlane: BABYLON.Mesh = BABYLON.MeshBuilder.CreatePlane("scorePlane", { width: 2.4, height: 1.2 }, scene);
  scorePlane.material = scoreMaterial;
  scorePlane.position = new BABYLON.Vector3(3.6, 0, 0);
  scorePlane.rotation = new BABYLON.Vector3(Math.PI / 2, Math.PI / 2, 0);

  // Update function to refresh scores
  scene.onBeforeRenderObservable.add(() => {
    updateScoreText();
  });

  // Paddle movement variables
  const areaMaxX: number = areaHeight / 2; // Maximum x-position of the area
  const areaMinX: number = -areaHeight / 2; // Minimum x-position of the area
  let paddle1Input: number = 0;
  let paddle2Input: number = 0;

  // Add input handling for paddle movement
  window.addEventListener("keydown", (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowUp": // Move Paddle 1 (Player 1) Up
        paddle1Input |= 0b01;
        break;
      case "ArrowDown": // Move Paddle 1 (Player 1) Down
        paddle1Input |= 0b10;
        break;
      case "w": // Move Paddle 2 (Player 2) Up
        paddle2Input |= 0b01;
        break;
      case "s": // Move Paddle 2 (Player 2) Down
        paddle2Input |= 0b10;
        break;
    }
  });

  window.addEventListener("keyup", (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowUp":
        paddle1Input &= ~0b01; // Stop Paddle 1 Up movement
        break;
      case "ArrowDown":
        paddle1Input &= ~0b10; // Stop Paddle 1 Down movement
        break;
      case "w":
        paddle2Input &= ~0b01; // Stop Paddle 2 Up movement
        break;
      case "s":
        paddle2Input &= ~0b10; // Stop Paddle 2 Down movement
        break;
    }
  });

  // Ball movement logic
  function updateBallPosition(ball: BABYLON.Mesh, deltaTime: number) : undefined{
    ball.position.x += ballVelocity.x * ballSpeed * deltaTime; // Update ball x position
    ball.position.z += ballVelocity.y * ballSpeed * deltaTime; // Update ball z position
    const ballPosition: BABYLON.Vector3 = ball.position;

    // Handle ball collision with walls
    if (ballPosition.x - ballRadius < areaMinX
      || ballPosition.x + ballRadius > areaMaxX
    ) {
      ballVelocity.x *= -1; // Reverse direction
    }

    // Handle ball collision with paddles
    if (
      (Math.abs(ballPosition.z - paddle1.position.z) < paddleDepth / 2 + ballRadius
        && Math.abs(ballPosition.x - paddle1.position.x) < paddleWidth / 2 + ballRadius)
      || (Math.abs(ballPosition.z - paddle2.position.z) < paddleDepth / 2 + ballRadius
        && Math.abs(ballPosition.x - paddle2.position.x) < paddleWidth / 2 + ballRadius)
    ) {
      ballVelocity.y *= -1; // Reverse direction
    }

    // Handle ballPosition going out of bounds (score logic)
    if (ballPosition.z - ballRadius < -5) {
      gameState.p2Score += 1;
      resetBall(ball);
    } else if (ballPosition.z + ballRadius > 5) {
      gameState.p1Score += 1;
      resetBall(ball);
    }
  }

  // Reset ball position and velocity
  function resetBall(ball: BABYLON.Mesh) : undefined {
    ball.position.x = 0;
    ball.position.z = 0;

    const excludedAngles: Array<number> = [
        0,                    // 0 degrees
        Math.PI / 2,          // 90 degrees
        Math.PI,              // 180 degrees
        (3 * Math.PI) / 2,    // 270 degrees
        Math.PI * 2,          // 360 degrees
    ];
    const margin: number = Math.PI / 18; // Margin in radians (10° = π/18)

    let angle: number;

    // Generate a random angle until it is not in the excluded angles
    do {
        angle = Math.random() * Math.PI * 2; // Random angle in radians
    } while (excludedAngles.some(excludedAngle => {
      return angle >= excludedAngle - margin
          && angle <= excludedAngle + margin;
    }))

    ballVelocity.x = Math.cos(angle);
    ballVelocity.y = Math.sin(angle);
  }

  // WebSocket setup for real-time communication
  fetch("/api/config")
    .then((response: Response) => response.json())
    .then((config: { domainName: string; port: number }) => {
      const socket: WebSocket = new WebSocket(
        `ws://${config.domainName}:${config.port}`,
      );

      socket.onopen = () => {
        console.log("Connected to server");
      };

      socket.onmessage = (event: MessageEvent) => {
        const data = JSON.parse(event.data) as {
          ballPosition: BABYLON.Vector2;
        };

        // Update ball position based on server data
        ball.position.x = data.ballPosition.x;
        ball.position.z = data.ballPosition.y;

        // Handle other game updates
      };

      socket.onclose = () => {
        console.log("Disconnected from server");
      };
    })
    .catch((error: any) => console.error("Error fetching config:", error));

  resetBall(ball);

  // Game render loop
  engine.runRenderLoop(() => {
    const deltaTime: number = engine.getDeltaTime() / 1000; // Get the delta time as seconds (default milliseconds)

    // Update paddle positions
    paddle1.position.x +=
      ((paddle1Input & 0b1) - ((paddle1Input >> 1) & 0b1)) * paddleSpeed * deltaTime;
    paddle2.position.x +=
      ((paddle2Input & 0b1) - ((paddle2Input >> 1) & 0b1)) * paddleSpeed * deltaTime;

    // Clamp paddle positions to prevent them from going out of bounds
    paddle1.position.x = Math.min(
      Math.max(paddle1.position.x, areaMinX + paddleWidth / 2),
      areaMaxX - paddleWidth / 2,
    );
    paddle2.position.x = Math.min(
      Math.max(paddle2.position.x, areaMinX + paddleWidth / 2),
      areaMaxX - paddleWidth / 2,
    );

    updateBallPosition(ball, deltaTime);

    // Render the scene
    scene.render();
  });

  // Handle window resizing
  window.addEventListener("resize", () => {
    engine.resize();
  });
}
