// Babylon.js setup
const canvas = document.getElementById("renderCanvas"); // Get the canvas element
canvas.style.width = "100%"; // Full width
canvas.style.height = "100%"; // Full height

const engine = new BABYLON.Engine(canvas, true); // Initialize the Babylon.js engine

const scene = new BABYLON.Scene(engine);
scene.detachControl();

const camera = new BABYLON.ArcRotateCamera(
  "Camera",
  Math.PI,  // Horizontal rotation
  0,        // Vertical rotation
  10,       // Distance from target
  new BABYLON.Vector3(0, 0, 0), // Target position
  scene
);

camera.attachControl(canvas, false); // Attach to the canvas without user controls
camera.lowerAlphaLimit = camera.alpha; // Lock horizontal rotation
camera.upperAlphaLimit = camera.alpha;
camera.lowerBetaLimit = camera.beta;   // Lock vertical rotation
camera.upperBetaLimit = camera.beta;
camera.lowerRadiusLimit = camera.radius; // Lock zoom
camera.upperRadiusLimit = camera.radius;

// Game elements: paddles, ball, and ground
const paddle1 = BABYLON.MeshBuilder.CreateBox("paddle1", { width: 1, height: 0.1, depth: 0.1 }, scene);
paddle1.position = new BABYLON.Vector3(0, 0, -4);

const paddle2 = BABYLON.MeshBuilder.CreateBox("paddle2", { width: 1, height: 0.1, depth: 0.1 }, scene);
paddle2.position = new BABYLON.Vector3(0, 0, 4);

// Create the paddle material
const paddleMaterial = new BABYLON.StandardMaterial("paddleMaterial", scene);
paddleMaterial.emissiveColor = BABYLON.Color3.White();

// Apply the material to the paddles
paddle1.material = paddleMaterial;
paddle2.material = paddleMaterial;

const ballRadius = 0.1; // The radius of the ball
const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: ballRadius*2 }, scene);

// Create the ball material
const ballMaterial = new BABYLON.StandardMaterial("ballMaterial", scene);
ballMaterial.emissiveColor = BABYLON.Color3.Gray();

ball.material = ballMaterial;

const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 6, height: 10 }, scene);

// Create the ground material
const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
groundMaterial.emissiveColor = BABYLON.Color3.Black();

ground.material = groundMaterial;

// Paddle movement variables
const paddleSpeed = 0.1; // Speed of paddle movement
const paddleMaxX = 3; // Maximum x-position for paddles
const paddleMinX = -3; // Minimum x-position for paddles
let paddle1Input = 0;
let paddle2Input = 0;

// Add input handling for paddle movement
window.addEventListener("keydown", (event) => {
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

window.addEventListener("keyup", (event) => {
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
const ballSpeed = 0.1; // Speed of ball
let ballVelocityX = 0;
let ballVelocityZ = 0;

function updateBallPosition(ball) {
  ball.position.x += ballVelocityX * ballSpeed; // Update ball x position
  ball.position.z += ballVelocityZ * ballSpeed; // Update ball z position
  const ballPosition = ball.position;

  // Handle ball collision with walls
  if (ballPosition.x - ballRadius < -3 || ballPosition.x + ballRadius > 3) {
    ballVelocityX *= -1; // Reverse direction
  }

  // Handle ball collision with paddles
  if ((Math.abs(ballPosition.z - paddle1.position.z) < 0.2 && Math.abs(ballPosition.x - paddle1.position.x) < 0.5)
    || (Math.abs(ballPosition.z - paddle2.position.z) < 0.2 && Math.abs(ballPosition.x - paddle2.position.x) < 0.5)) {
    ballVelocityZ *= -1; // Reverse direction
  }

  // Handle ballPosition going out of bounds (score logic)
  if (ballPosition.z - ballRadius < -5) {
    console.log('Player 2 scores!');
    resetBall();
  } else if (ballPosition.z + ballRadius > 5) {
    console.log('Player 1 scores!');
    resetBall();
  }
}

// Reset ball position and velocity
function resetBall() {
  ball.position.x = 0;
  ball.position.z = 0;

  const angle = Math.random() * Math.PI * 2;
  ballVelocityX = Math.cos(angle);
  ballVelocityZ = Math.sin(angle);
}

// WebSocket setup for real-time communication
// fetch('/config')
// .then((response) => response.json())
// .then((config) => {
//   const socket = new WebSocket(`ws://${config.domainName}:${config.port}`);

//   socket.onopen = () => {
//     console.log("Connected to server");
//   };

//   socket.onmessage = (event) => {
//     const data = JSON.parse(event.data);

//     // Example: Update ball position based on server data
//     ball.position.x = data.ballPosition.x;
//     ball.position.z = data.ballPosition.z;

//     // Handle other game updates
//   };

//   socket.onclose = () => {
//     console.log("Disconnected from server");
//   };
// })
// .catch((error) => console.error('Error fetching config:', error));

resetBall();

// Game render loop
engine.runRenderLoop(() => {
  // Update paddle positions
  paddle1.position.x += ((paddle1Input & 0b1) - ((paddle1Input >> 1) & 0b1)) * paddleSpeed;
  paddle2.position.x += ((paddle2Input & 0b1) - ((paddle2Input >> 1) & 0b1)) * paddleSpeed;

  // Clamp paddle positions to prevent them from going out of bounds
  paddle1.position.x = Math.min(Math.max(paddle1.position.x, paddleMinX), paddleMaxX);
  paddle2.position.x = Math.min(Math.max(paddle2.position.x, paddleMinX), paddleMaxX);

  updateBallPosition(ball);

  // Render the scene
  scene.render();
});

// Handle window resizing
window.addEventListener("resize", () => {
  engine.resize();
});
