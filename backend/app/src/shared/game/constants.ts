// Area
export const areaWidth: number = 10; // Width of the game area
export const areaHeight: number = 6; // Height of the game area

export const areaMaxX: number = areaHeight / 2; // Maximum x-position of the area
export const areaMinX: number = -areaHeight / 2; // Minimum x-position of the area

// Paddle
export const paddleWidth: number = 1; // Width of the paddles
export const paddleHalfWidth: number = paddleWidth / 2;
export const paddleDepth: number = 0.1; // Depth of the paddles
export const paddleHalfDepth: number = paddleDepth / 2;
export const paddleSpeed: number = 5; // Speed of paddle movement

export const paddleDefaultZPosition: number = areaWidth / 2 - 0.6;

// Ball
export const ballRadius: number = 0.1; // The default radius of the ball
export const ballSpeed: number = 5; // The default speed of the ball
export const ballSpeedFactor: number = 1.1; // Factor to increase ball speed

// Others
export const scoreToWin: number = 11; // the score to win the game

export const cameraRotationSpeed: number = 0.2; // Speed of camera rotation when in the menu