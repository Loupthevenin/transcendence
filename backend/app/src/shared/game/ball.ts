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

type CollisionData = { axis: "x" | "y", time: number };

function calculateCollisionForPaddle(ballPos: BABYLON.Vector2, ballVel: BABYLON.Vector2, paddlePos: BABYLON.Vector2): CollisionData | null {
  // --- X-Axis Collision ---
  let collisionTimeX: number = Infinity;
  // Compute the time t when the ball's x coordinate will hit the paddle's x-boundary.
  if (ballVel.x !== 0) {
    let t: number;
    if (ballVel.x > 0) {
      // Moving right: collision when ball center reaches paddle's right boundary.
      t = ((paddlePos.x - ballPaddleCollisionMarginX) - ballPos.x) / (ballVel.x * GAME_CONSTANT.ballSpeed);
    } else { 
      // Moving left: collision when ball center reaches paddle's left boundary.
      t = (ballPos.x - (paddlePos.x + ballPaddleCollisionMarginX)) / (Math.abs(ballVel.x) * GAME_CONSTANT.ballSpeed);
    }
    if (t >= 0) {
      // Predict the ball's y position at collision time.
      const futureY: number = ballPos.y + ballVel.y * GAME_CONSTANT.ballSpeed * t;
      // Check if the predicted y position falls within the paddle's vertical bounds.
      if (futureY >= (paddlePos.y - ballPaddleCollisionMarginY) && futureY <= (paddlePos.y + ballPaddleCollisionMarginY)) {
        collisionTimeX = t;
      }
    }
  }

  // --- Y-Axis Collision ---
  let collisionTimeY: number = Infinity;
  // Compute the time t when the ball's y coordinate will hit the paddle's y-boundary.
  if (ballVel.y !== 0) {
    let t: number;
    if (ballVel.y > 0) {
      // Moving up: collision when ball center reaches paddle's top boundary.
      t = ((paddlePos.y - ballPaddleCollisionMarginY) - ballPos.y) / (ballVel.y * GAME_CONSTANT.ballSpeed);
    } else {
      // Moving down: collision when ball center reaches paddle's bottom boundary.
      t = (ballPos.y - (paddlePos.y + ballPaddleCollisionMarginY)) / (Math.abs(ballVel.y) * GAME_CONSTANT.ballSpeed);
    }
    if (t >= 0) {
      // Predict the ball's x position at collision time.
      const futureX: number = ballPos.x + ballVel.x * GAME_CONSTANT.ballSpeed * t;
      // Check if the predicted x position falls within the paddle's horizontal bounds.
      if (futureX >= (paddlePos.x - ballPaddleCollisionMarginX) && futureX <= (paddlePos.x + ballPaddleCollisionMarginX)) {
        collisionTimeY = t;
      }
    }
  }

  // --- Determine the earliest valid collision ---
  if (collisionTimeX === Infinity && collisionTimeY === Infinity) {
    return null; // No collision will occur.
  } else if (collisionTimeX <= collisionTimeY) {
    return { axis: "x", time: collisionTimeX };
  } else {
    return { axis: "y", time: collisionTimeY };
  }
}

function calculateCollisionForWalls(ballPos: BABYLON.Vector2, ballVel: BABYLON.Vector2): CollisionData | null {
  let collisionTimeX: number | null = null;

  if (ballVel.x < 0 && ballPos.x > ballAreaMinX) {
    collisionTimeX = (ballPos.x - ballAreaMinX) / (Math.abs(ballVel.x) * GAME_CONSTANT.ballSpeed);
  } else if (ballVel.x > 0 && ballPos.x < ballAreaMaxX) {
    collisionTimeX = (ballAreaMaxX - ballPos.x) / (Math.abs(ballVel.x) * GAME_CONSTANT.ballSpeed);
  }

  if (collisionTimeX !== null) {
    return { axis: "x", time: collisionTimeX };
  }

  return null; // No collision
}

function handleCollision(collision: CollisionData, ballPos: BABYLON.Vector2, ballVel: BABYLON.Vector2): void {
  // Safe guard to prevent a zero-step collision that will cause an infinite loop
  if (collision.time <= 1e-6) {
    collision.time = 1e-6;
  }
  // Update position to collision point
  ballPos.x += ballVel.x * GAME_CONSTANT.ballSpeed * collision.time;
  ballPos.y += ballVel.y * GAME_CONSTANT.ballSpeed * collision.time;

  // Reverse velocity
  if (collision.axis === "x") ballVel.x *= -1;
  else if (collision.axis === "y") ballVel.y *= -1;
}

// Ball movement logic
export function updateBallPosition(gameData: GameData, deltaTime: number, ballMesh?: BABYLON.Mesh): void {
  const ballPos: BABYLON.Vector2 = gameData.ball.position;
  const ballVel: BABYLON.Vector2 = gameData.ball.velocity;

  let remainingTime: number = deltaTime;
  const allCollisions: (CollisionData | null)[] = [];

  while (remainingTime > 1e-6) {
    allCollisions.length = 0; // Clear the content

    // Check for wall collisions
    allCollisions.push(calculateCollisionForWalls(ballPos, ballVel));

    // Check for paddle collisions
    allCollisions.push(calculateCollisionForPaddle(ballPos, ballVel, gameData.paddle1Position));
    allCollisions.push(calculateCollisionForPaddle(ballPos, ballVel, gameData.paddle2Position));

    // Determine the earliest collision
    let earliestCollision: CollisionData | null = null;
    if (allCollisions.length > 0) {
      // Sort the array by push all null to the end and sorting by croissant order of CollisionData.time
      allCollisions.sort((colA: CollisionData | null, colB: CollisionData | null) => {
        if (colA === null) return 1;
        else if (colB === null)  return -1;
        return colA.time < colB.time ? -1 : 1;
      });
      earliestCollision = allCollisions[0];
    }

    if (earliestCollision && earliestCollision.time <= remainingTime) {
      handleCollision(earliestCollision, ballPos, ballVel);
      // Update remaining time in the frame
      remainingTime -= earliestCollision.time;
    } else {
      // No more collisions, update position normally
      ballPos.x += ballVel.x * GAME_CONSTANT.ballSpeed * remainingTime;
      ballPos.y += ballVel.y * GAME_CONSTANT.ballSpeed * remainingTime;
      break;
    }
  }

  // Handle ball position going out of bounds (score logic)
  if (ballPos.y - GAME_CONSTANT.ballRadius < -GAME_CONSTANT.areaWidth / 2) {
    gameData.p1Score += 1;
    resetBall(gameData.ball);
  } else if (ballPos.y + GAME_CONSTANT.ballRadius > GAME_CONSTANT.areaWidth / 2) {
    gameData.p2Score += 1;
    resetBall(gameData.ball);
  }

  if (ballMesh) {
    ballMesh.position.x = ballPos.x;
    ballMesh.position.z = ballPos.y;
  }
}

// Reset ball position and velocity
export function resetBall(ball: Ball): void {
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
