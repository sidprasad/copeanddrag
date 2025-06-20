/**
 * Unit tests for geometry utility functions
 */
import {
    adjustPointToRectanglePerimeter,
    distance,
    midpoint,
    isPointInRectangle,
    closestPointOnRectangle
} from '../geometry';
import { Point, Rectangle } from '../types';

describe('Geometry Utils', () => {
    describe('adjustPointToRectanglePerimeter', () => {
        const rect: Rectangle = { x: 10, y: 10, width: 100, height: 50 };

        it('should adjust point outside left boundary', () => {
            const point: Point = { x: 5, y: 30 };
            const result = adjustPointToRectanglePerimeter(point, rect);
            expect(result.x).toBe(7); // 10 - 3 (padding)
            expect(result.y).toBe(30);
        });

        it('should adjust point outside right boundary', () => {
            const point: Point = { x: 120, y: 30 };
            const result = adjustPointToRectanglePerimeter(point, rect);
            expect(result.x).toBe(113); // 10 + 100 + 3 (padding)
            expect(result.y).toBe(30);
        });

        it('should adjust point outside top boundary', () => {
            const point: Point = { x: 50, y: 5 };
            const result = adjustPointToRectanglePerimeter(point, rect);
            expect(result.x).toBe(50);
            expect(result.y).toBe(7); // 10 - 3 (padding)
        });

        it('should adjust point outside bottom boundary', () => {
            const point: Point = { x: 50, y: 70 };
            const result = adjustPointToRectanglePerimeter(point, rect);
            expect(result.x).toBe(50);
            expect(result.y).toBe(63); // 10 + 50 + 3 (padding)
        });

        it('should not adjust point already inside bounds', () => {
            const point: Point = { x: 50, y: 30 };
            const result = adjustPointToRectanglePerimeter(point, rect);
            expect(result.x).toBe(50);
            expect(result.y).toBe(30);
        });
    });

    describe('distance', () => {
        it('should calculate distance between two points', () => {
            const p1: Point = { x: 0, y: 0 };
            const p2: Point = { x: 3, y: 4 };
            const result = distance(p1, p2);
            expect(result).toBe(5); // 3-4-5 triangle
        });

        it('should return 0 for same points', () => {
            const p1: Point = { x: 10, y: 20 };
            const p2: Point = { x: 10, y: 20 };
            const result = distance(p1, p2);
            expect(result).toBe(0);
        });

        it('should calculate distance for negative coordinates', () => {
            const p1: Point = { x: -3, y: -4 };
            const p2: Point = { x: 0, y: 0 };
            const result = distance(p1, p2);
            expect(result).toBe(5);
        });
    });

    describe('midpoint', () => {
        it('should calculate midpoint between two points', () => {
            const p1: Point = { x: 0, y: 0 };
            const p2: Point = { x: 10, y: 20 };
            const result = midpoint(p1, p2);
            expect(result.x).toBe(5);
            expect(result.y).toBe(10);
        });

        it('should handle negative coordinates', () => {
            const p1: Point = { x: -10, y: -5 };
            const p2: Point = { x: 10, y: 5 };
            const result = midpoint(p1, p2);
            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
        });

        it('should handle same points', () => {
            const p1: Point = { x: 15, y: 25 };
            const p2: Point = { x: 15, y: 25 };
            const result = midpoint(p1, p2);
            expect(result.x).toBe(15);
            expect(result.y).toBe(25);
        });
    });

    describe('isPointInRectangle', () => {
        const rect: Rectangle = { x: 10, y: 20, width: 100, height: 50 };

        it('should return true for point inside rectangle', () => {
            const point: Point = { x: 50, y: 40 };
            expect(isPointInRectangle(point, rect)).toBe(true);
        });

        it('should return true for point on rectangle boundary', () => {
            const point: Point = { x: 10, y: 20 }; // top-left corner
            expect(isPointInRectangle(point, rect)).toBe(true);
            
            const point2: Point = { x: 110, y: 70 }; // bottom-right corner
            expect(isPointInRectangle(point2, rect)).toBe(true);
        });

        it('should return false for point outside rectangle', () => {
            const point: Point = { x: 5, y: 40 }; // left of rectangle
            expect(isPointInRectangle(point, rect)).toBe(false);
            
            const point2: Point = { x: 50, y: 15 }; // above rectangle
            expect(isPointInRectangle(point2, rect)).toBe(false);
        });
    });

    describe('closestPointOnRectangle', () => {
        const rect: Rectangle = { x: 10, y: 20, width: 100, height: 50 };

        it('should return same point if already on rectangle', () => {
            const point: Point = { x: 50, y: 40 };
            const result = closestPointOnRectangle(point, rect);
            expect(result.x).toBe(50);
            expect(result.y).toBe(40);
        });

        it('should clamp point to left edge', () => {
            const point: Point = { x: 5, y: 40 };
            const result = closestPointOnRectangle(point, rect);
            expect(result.x).toBe(10);
            expect(result.y).toBe(40);
        });

        it('should clamp point to right edge', () => {
            const point: Point = { x: 120, y: 40 };
            const result = closestPointOnRectangle(point, rect);
            expect(result.x).toBe(110);
            expect(result.y).toBe(40);
        });

        it('should clamp point to top edge', () => {
            const point: Point = { x: 50, y: 15 };
            const result = closestPointOnRectangle(point, rect);
            expect(result.x).toBe(50);
            expect(result.y).toBe(20);
        });

        it('should clamp point to bottom edge', () => {
            const point: Point = { x: 50, y: 80 };
            const result = closestPointOnRectangle(point, rect);
            expect(result.x).toBe(50);
            expect(result.y).toBe(70);
        });

        it('should clamp point to corner', () => {
            const point: Point = { x: 5, y: 15 }; // outside top-left
            const result = closestPointOnRectangle(point, rect);
            expect(result.x).toBe(10);
            expect(result.y).toBe(20);
        });
    });
});
