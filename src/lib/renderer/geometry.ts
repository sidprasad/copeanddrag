/**
 * Geometric utility functions for the renderer
 * 
 * This module contains functions for geometric calculations, point adjustments,
 * and spatial relationships used in the layout and rendering process.
 */
import { Point, Rectangle } from './types';

/**
 * Adjust a point to be on the perimeter of a rectangle with padding
 * 
 * This function ensures that a point is positioned on or outside the boundary
 * of a rectangle, with additional padding applied.
 * 
 * @param point - The point to adjust
 * @param rect - The rectangle to adjust the point relative to
 * @returns The adjusted point positioned on the rectangle's perimeter with padding
 */
export function adjustPointToRectanglePerimeter(point: Point, rect: Rectangle): Point {
    const { x, y, width, height } = rect;
    const padding = 3; // Padding in pixels

    const tl_X = x - padding;
    const tl_Y = y - padding;
    const br_X = x + width + padding;
    const br_Y = y + height + padding;

    let adjustedX = point.x;
    let adjustedY = point.y;

    if (point.x < tl_X) {
        adjustedX = tl_X;
    } else if (point.x > br_X) {
        adjustedX = br_X;
    }

    if (point.y < tl_Y) {
        adjustedY = tl_Y;
    } else if (point.y > br_Y) {
        adjustedY = br_Y;
    }

    return { x: adjustedX, y: adjustedY };
}

/**
 * Calculate the Euclidean distance between two points
 * 
 * @param p1 - First point
 * @param p2 - Second point
 * @returns The distance between the two points
 */
export function distance(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the midpoint between two points
 * 
 * @param p1 - First point
 * @param p2 - Second point
 * @returns The midpoint between the two points
 */
export function midpoint(p1: Point, p2: Point): Point {
    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
    };
}

/**
 * Check if a point is inside a rectangle
 * 
 * @param point - The point to check
 * @param rect - The rectangle to check against
 * @returns True if the point is inside the rectangle
 */
export function isPointInRectangle(point: Point, rect: Rectangle): boolean {
    return point.x >= rect.x && 
           point.x <= rect.x + rect.width &&
           point.y >= rect.y && 
           point.y <= rect.y + rect.height;
}

/**
 * Get the closest point on a rectangle to a given point
 * 
 * @param point - The reference point
 * @param rect - The rectangle to find the closest point on
 * @returns The closest point on the rectangle's boundary to the given point
 */
export function closestPointOnRectangle(point: Point, rect: Rectangle): Point {
    const { x, y, width, height } = rect;
    
    let closestX = Math.max(x, Math.min(point.x, x + width));
    let closestY = Math.max(y, Math.min(point.y, y + height));
    
    return { x: closestX, y: closestY };
}
