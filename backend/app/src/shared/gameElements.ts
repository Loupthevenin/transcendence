import { Vector2 } from 'babylonjs';

export { Vector2 };

export interface GameState {
  ballPosition: Vector2;
  paddle1Position: Vector2;
  paddle2Position: Vector2;
  p1Score: number;
  p2Score: number;
}
