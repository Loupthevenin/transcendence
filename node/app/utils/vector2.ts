export class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  // Static method to return a zero vector
  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  // Add two vectors
  static add(v1: Vector2, v2: Vector2): Vector2 {
    return new Vector2(v1.x + v2.x, v1.y + v2.y);
  }

  // Subtract two vectors
  static subtract(v1: Vector2, v2: Vector2): Vector2 {
    return new Vector2(v1.x - v2.x, v1.y - v2.y);
  }

  // Scale a vector by either a scalar or another vector
  static scale(v1: Vector2, valueOrVector: number | Vector2): Vector2 {
    if (typeof valueOrVector === 'number') {
      return new Vector2(v1.x * valueOrVector, v1.y * valueOrVector);
    } else {
      return new Vector2(v1.x * valueOrVector.x, v1.y * valueOrVector.y);
    }
  }

  // Divide a vector by either a scalar or another vector
  static divide(v1: Vector2, valueOrVector: number | Vector2): Vector2 {
    if (typeof valueOrVector === 'number') {
      return new Vector2(v1.x / valueOrVector, v1.y / valueOrVector);
    } else {
      return new Vector2(v1.x / valueOrVector.x, v1.y / valueOrVector.y);
    }
  }

  // Calculate the length of a vector
  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  // Normalize the vector (make its length 1)
  normalize(): Vector2 {
    const length = this.length();
    if (length === 0) {
      return Vector2.zero();
    }
    return new Vector2(this.x / length, this.y / length);
  }

  // Calculate the dot product of two vectors
  static dotProduct(v1: Vector2, v2: Vector2): number {
    return v1.x * v2.x + v1.y * v2.y;
  }
}
