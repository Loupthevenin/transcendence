import { BABYLON, GAME_CONSTANT, isVector2, GameData } from "./gameElements";

export interface Ball {
  position: BABYLON.Vector2;
  velocity: BABYLON.Vector2;
}

export function isBall(data: any): data is Ball {
  return (
    data &&
    isVector2(data.position) &&
    isVector2(data.velocity)
  );
}

const ballAreaMinX: number = GAME_CONSTANT.areaMinX + GAME_CONSTANT.ballRadius;
const ballAreaMaxX: number = GAME_CONSTANT.areaMaxX - GAME_CONSTANT.ballRadius;
const ballPaddleCollisionMarginX: number = GAME_CONSTANT.paddleHalfWidth + GAME_CONSTANT.ballRadius;
const ballPaddleCollisionMarginY: number = GAME_CONSTANT.paddleHalfDepth + GAME_CONSTANT.ballRadius;

function isCollidingWithPaddle(ballPos: BABYLON.Vector2, paddlePos: BABYLON.Vector2) : boolean {
  return Math.abs(ballPos.x - paddlePos.x) < ballPaddleCollisionMarginX
      && Math.abs(ballPos.y - paddlePos.y) < ballPaddleCollisionMarginY;
}

// Ball movement logic
export function updateBallPosition(gameData: GameData, deltaTime: number, ballMesh?: BABYLON.Mesh) : void {
  const ballPos: BABYLON.Vector2 = gameData.ball.position;
  const ballVel: BABYLON.Vector2 = gameData.ball.velocity;
  const ballNewPos: BABYLON.Vector2 = new BABYLON.Vector2(ballPos.x, ballPos.y);

  // Update ball position
  ballNewPos.x += ballVel.x * GAME_CONSTANT.ballSpeed * deltaTime;
  ballNewPos.y += ballVel.y * GAME_CONSTANT.ballSpeed * deltaTime;

  // Handle ball collision with paddles
  if ((isCollidingWithPaddle(ballNewPos, gameData.paddle1Position)
        || isCollidingWithPaddle(ballNewPos, gameData.paddle2Position))
      && !(isCollidingWithPaddle(ballPos, gameData.paddle1Position)
        || isCollidingWithPaddle(ballPos, gameData.paddle2Position))
  ) {
    ballVel.y *= -1; // Reverse direction
    ballNewPos.y = ballPos.y; // Reset position to prevent getting stuck
  }

  // Handle ball collision with walls
  if ((ballNewPos.x < ballAreaMinX || ballNewPos.x > ballAreaMaxX) // if new position is out of bounds
      && !(ballPos.x < ballAreaMinX || ballPos.x > ballAreaMaxX)   // and previous position was in bounds
  ) {
    ballVel.x *= -1; // Reverse direction
    ballNewPos.x = ballPos.x; // Reset position to prevent getting stuck
  }

  // Handle ball position going out of bounds (score logic)
  if (ballNewPos.y - GAME_CONSTANT.ballRadius < -GAME_CONSTANT.areaWidth / 2) {
    gameData.p1Score += 1;
    resetBall(gameData.ball);
  } else if (ballNewPos.y + GAME_CONSTANT.ballRadius > GAME_CONSTANT.areaWidth / 2) {
    gameData.p2Score += 1;
    resetBall(gameData.ball);
  } else {
    // Update ball position with the new position
    ballPos.x = ballNewPos.x;
    ballPos.y = ballNewPos.y;
  }

  if (ballMesh) {
    ballMesh.position.x = ballPos.x;
    ballMesh.position.z = ballPos.y;
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
  const margin: number = BABYLON.Tools.ToRadians(15); // Margin of excluded angles

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
