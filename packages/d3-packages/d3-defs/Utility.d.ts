/**
 * This is going to be a generic utility file. Primarily for factoring
 * out algorithms with a higher level of computational complexity.
 */
export declare function toFunc<T>(defaultValue: T, t?: T | (() => T)): (() => T);
export interface Coords {
    x: number;
    y: number;
}
/**
 * Generic props for representing a box around an object.
 */
export interface BoundingBox {
    top_left: Coords;
    bottom_right: Coords;
}
export declare function boxUnion(boxes: BoundingBox[]): {
    top_left: {
        x: number;
        y: number;
    };
    bottom_right: {
        x: number;
        y: number;
    };
};
export interface ExperimentalBoundingBox {
    lambda: (radians: number) => Coords;
}
/**
 * Simple method averaging the coordinate points in a series.
 * @param points
 * @returns
 */
export declare function averagePath(points: Coords[]): Coords;
/**
 * Shifts a function list of points according to a shift variable
 * @param pointList
 * @param shift
 * @returns
 */
export declare function shiftList(pointList: (() => Coords)[], shift: () => Coords): (() => Coords)[];
/**
 * Utility function returning bounding box for a list of points
 * @param pointList list of points as coords
 * @returns bounding box
 */
export declare function boundsOfList(pointList: Coords[]): BoundingBox;
//# sourceMappingURL=Utility.d.ts.map