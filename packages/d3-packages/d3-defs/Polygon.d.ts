import { Shape, ShapeProps } from './Shape';
import { BoundingBox, Coords } from './Utility';
export interface PolygonProps extends ShapeProps {
    points: Coords[] | (() => Coords)[];
}
/**
 * Class Representing Polygonal objects. Takes the form of any
 * series of points, and will form a polygon with said points as the boundary.
 */
export declare class Polygon extends Shape {
    pointsRelative: (() => Coords)[];
    /**
     * Constructs a polygon object
     * @param points list of points forming outside
     * @param color color of interior
     * @param borderWidth width of the border
     * @param borderColor color of the border
     * @param label text to label with
     * @param labelColor color of label text
     * @param labelSize size of the label
     */
    constructor(props: PolygonProps);
    boundingBox(): BoundingBox;
    render(svg: any): void;
}
//# sourceMappingURL=Polygon.d.ts.map