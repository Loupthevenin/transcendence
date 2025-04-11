import { BABYLON, GAME_CONSTANT, GameData } from "./gameElements";

export interface Ball {
  position: BABYLON.Vector2;
  velocity: BABYLON.Vector2;
}

// Ball movement logic
export function updateBallPosition(gameData: GameData, deltaTime: number) : void {
  const ballPos: BABYLON.Vector2 = gameData.ball.position;
  const ballVel: BABYLON.Vector2 = gameData.ball.velocity;

  // Update ball position
  ballPos.x += ballVel.x * GAME_CONSTANT.ballSpeed * deltaTime;
  ballPos.y += ballVel.y * GAME_CONSTANT.ballSpeed * deltaTime;

  // Handle ball collision with walls
  if (ballPos.x - GAME_CONSTANT.ballRadius < GAME_CONSTANT.areaMinX
    || ballPos.x + GAME_CONSTANT.ballRadius > GAME_CONSTANT.areaMaxX
  ) {
    ballVel.x *= -1; // Reverse direction
  }

  // Handle ball collision with paddles
  if (
    (Math.abs(ballPos.y - gameData.paddle1Position.y) < GAME_CONSTANT.paddleDepth / 2 + GAME_CONSTANT.ballRadius
      && Math.abs(ballPos.x - gameData.paddle1Position.x) < GAME_CONSTANT.paddleWidth / 2 + GAME_CONSTANT.ballRadius)
    || (Math.abs(ballPos.y - gameData.paddle2Position.y) < GAME_CONSTANT.paddleDepth / 2 + GAME_CONSTANT.ballRadius
      && Math.abs(ballPos.x - gameData.paddle2Position.x) < GAME_CONSTANT.paddleWidth / 2 + GAME_CONSTANT.ballRadius)
  ) {
    ballVel.y *= -1; // Reverse direction
  }

  // Handle ball position going out of bounds (score logic)
  if (ballPos.y - GAME_CONSTANT.ballRadius < -GAME_CONSTANT.areaWidth / 2) {
    gameData.p1Score += 1;
    resetBall(gameData.ball);
  } else if (ballPos.y + GAME_CONSTANT.ballRadius > GAME_CONSTANT.areaWidth / 2) {
    gameData.p2Score += 1;
    resetBall(gameData.ball);
  }
}

// Reset ball position and velocity
export function resetBall(ball: Ball) : void {
  ball.position.x = 0;
  ball.position.y = 0;

  const excludedAngles: Array<number> = [
      0,                 // 0 degrees
      Math.PI / 2,       // 90 degrees
      Math.PI,           // 180 degrees
      (3 * Math.PI) / 2, // 270 degrees
      Math.PI * 2,       // 360 degrees
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

  ball.velocity.x = Math.cos(angle);
  ball.velocity.y = Math.sin(angle);
}
