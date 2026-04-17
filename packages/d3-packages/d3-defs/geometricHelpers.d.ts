import { BoundingBox, Coords } from './Utility';
declare function distance(p1: Coords, p2: Coords): number;
declare function normalize(v: Coords): {
    x: number;
    y: number;
};
declare function mid_point(p1: Coords, p2: Coords): Coords;
export declare function lineAngle(p1: Coords, p2: Coords): number;
declare function get_minimum_distance(target_point: Coords, compare_points: Coords[]): Coords;
declare function bounding_box_to_lambda(boundingBox: BoundingBox): (r: number) => Coords;
export { distance, mid_point, get_minimum_distance, bounding_box_to_lambda, normalize };
//# sourceMappingURL=geometricHelpers.d.ts.map