import { Ball } from "./game/ball";
import { BABYLON, GAME_CONSTANT } from "./game/gameElements";

export enum INPUT {
  NONE = 0b00,
  UP = 0b01,
  DOWN = 0b10,
}

export type PaddleDraggingData = {
  pointerId: number;
  targetX: number | null;
};


// Function to handle player input and update paddle position
export function handlePlayerInput(
  paddlePosition: BABYLON.Vector2,
  paddleMesh: BABYLON.Mesh | undefined,
  keyInput: INPUT,
  draggingData: PaddleDraggingData,
  deltaTime: number,
): void {
  if (keyInput === 0 && draggingData.pointerId === -1) {
    return; // No key input, no movement
  }

  let deltaX: number = 0;
  if (draggingData.pointerId !== -1) {
    if (draggingData.targetX !== null) {
      const distanceToTarget: number = draggingData.targetX - paddlePosition.x;
      deltaX = Math.min(Math.max(distanceToTarget, -1), 1);
    }
  } else {
    deltaX = (keyInput & INPUT.UP ? 1 : 0) - (keyInput & INPUT.DOWN ? 1 : 0);
  }

  if (deltaX === 0) {
    return; // No delta, no movement
  }

  deltaX *= GAME_CONSTANT.paddleSpeed * deltaTime;

  // Update and clamp paddle positions to prevent them from going out of bounds
  paddlePosition.x = Math.min(
    Math.max(
      paddlePosition.x + deltaX,
      GAME_CONSTANT.areaMinX + GAME_CONSTANT.paddleHalfWidth,
    ),
    GAME_CONSTANT.areaMaxX - GAME_CONSTANT.paddleHalfWidth,
  );

  // Update paddle mesh positions
  if (paddleMesh) {
    paddleMesh.position.x = paddlePosition.x;
  }
}

// Function to handle AI input
export function handleAIInput(
  paddlePosition: BABYLON.Vector2,
  paddleMesh: BABYLON.Mesh | undefined,
  ball: Ball,
  deltaTime: number,
): void {
  // TODO: do some weird math to predict the ball position instead of the current one
  const draggingData: PaddleDraggingData = {
    pointerId: -2,
    targetX: ball.position.x,
  };

  handlePlayerInput(
    paddlePosition,
    paddleMesh,
    INPUT.NONE,
    draggingData,
    deltaTime,
  );
}
