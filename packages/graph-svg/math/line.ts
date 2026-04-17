import { Vector2 } from 'vector2';

/**
 * A line segment defined by two end points.
 */
export interface Line {
    a: Vector2
    b: Vector2
}

/**
 * Create a line segment from two points.
 */
function line (a: Vector2, b: Vector2): Line {
    return {a, b};
}

/**
 * Find the point where two lines intersect.
 */
function intersect (l1: Line, l2: Line): Vector2 {
    const p1 = l1.a;
    const p2 = l1.b;
    const p3 = l2.a;
    const p4 = l2.b;
    const s = (
        (p4.x - p3.x) * (p1.y - p3.y) -
        (p4.y - p3.y) * (p1.x - p3.x)
    ) / (
        (p4.y - p3.y) * (p2.x - p1.x) -
        (p4.x - p3.x) * (p2.y - p1.y)
    );
    return {
        x: p1.x + s * (p2.x - p1.x),
        y: p1.y + s * (p2.y - p1.y)
    }
}

/**
 * Calculate the slope of a line.
 */
function slope (l: Line): number {
    return (l.a.y - l.b.y) / (l.a.x - l.b.x);
}

export {
    line,
    intersect,
    slope
}