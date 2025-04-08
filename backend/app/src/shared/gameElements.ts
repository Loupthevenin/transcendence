import * as BABYLON from "babylonjs";

export { BABYLON };

export interface GameState {
  ballPosition: BABYLON.Vector2;
  paddle1Position: BABYLON.Vector2;
  paddle2Position: BABYLON.Vector2;
  p1Score: number;
  p2Score: number;
}
