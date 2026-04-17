export interface Vector2 {
  x: number;
  y: number;
}

export interface UpdateAPI {
  add(b: Vector2): UpdateAPI;
  rotate(center: Vector2, angle: number): UpdateAPI;
  subtract(b: Vector2): UpdateAPI;
  translate(angle: number, distance: number): UpdateAPI;
}

/**
 * Begin a sequence of updates to a vector
 */
export function update(vector: Vector2): UpdateAPI {
  const api = {
    add(b: Vector2): UpdateAPI {
      vector.x += b.x;
      vector.y += b.y;
      return api;
    },

    rotate(center: Vector2, angle: number): UpdateAPI {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const x = vector.x - center.x;
      const y = vector.y - center.y;
      vector.x = x * c - y * s + center.x;
      vector.y = x * s + y * c + center.y;
      return api;
    },

    subtract(b: Vector2): UpdateAPI {
      vector.x -= b.x;
      vector.y -= b.y;
      return api;
    },

    translate(angle: number, distance: number): UpdateAPI {
      vector.x += distance * Math.cos(angle);
      vector.y += distance * Math.sin(angle);
      return api;
    }
  };

  return api;
}

/**
 * Add two vectors
 */
export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Calculate the angle with respect to the positive x-axis
 */
export function angle(a: Vector2): number {
  return Math.atan2(-a.y, -a.x) + Math.PI;
}

/**
 * Average two vectors
 */
export function average(a: Vector2, b: Vector2): Vector2 {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

/**
 * Clone a vector
 */
export function clone(a: Vector2): Vector2 {
  return { x: a.x, y: a.y };
}

/**
 * Calculate the distance between two points
 */
export function distance(a: Vector2, b: Vector2): number {
  return Math.sqrt(distanceSq(a, b));
}

/**
 * Calculate the squared distance between two points
 */
export function distanceSq(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/**
 * Divide a vector by a scalar
 */
export function divideScalar(a: Vector2, s: number): Vector2 {
  if (s)
    return {
      x: a.x / s,
      y: a.y / s
    };
  return {
    x: 0,
    y: 0
  };
}

/**
 * Determine if two vectors are equivalent
 */
export function equals(a: Vector2, b: Vector2): boolean {
  return a.x === b.x && a.y === b.y;
}

/**
 * Calculate the length of a vector
 */
export function length(a: Vector2): number {
  return Math.sqrt(lengthSq(a));
}

/**
 * Calculate the squared length of a vector
 */
export function lengthSq(a: Vector2): number {
  return a.x * a.x + a.y * a.y;
}

/**
 * Multiply a vector by a scalar
 */
export function multiplyScalar(a: Vector2, s: number): Vector2 {
  return {
    x: s * a.x,
    y: s * a.y
  };
}

/**
 * Normalize a vector
 */
export function normal(a: Vector2): Vector2 {
  return divideScalar(a, length(a));
}

/**
 * Calculate the perpendicular vector
 */
export function perpendicular(a: Vector2): Vector2 {
  return {
    x: -a.y,
    y: a.x
  };
}

/**
 * Rotate a point around another point
 */
export function rotate(
  point: Vector2,
  center: Vector2,
  angle: number
): Vector2 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const x = point.x - center.x;
  const y = point.y - center.y;
  return {
    x: x * c - y * s + center.x,
    y: x * s + y * c + center.y
  };
}

/**
 * Subtract two vectors
 */
export function subtract(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Translate a point
 */
export function translate(
  a: Vector2,
  angle: number,
  distance: number
): Vector2 {
  return {
    x: a.x + distance * Math.cos(angle),
    y: a.y + distance * Math.sin(angle)
  };
}
