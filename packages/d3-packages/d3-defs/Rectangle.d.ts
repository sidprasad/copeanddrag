import { Shape, ShapeProps } from './Shape';
import { BoundingBox, Coords } from './Utility';
export interface RectangleProps extends ShapeProps {
    height: number | (() => number);
    width: number | (() => number);
    coords?: Coords | (() => Coords);
}
export declare class Rectangle extends Shape {
    height: () => number;
    width: () => number;
    /**
     * Creates a logical rectangle object
     * @param height height (y direction)
     * @param width width (x direction)
     * @param coords coordinates of the top-left point
     * @param color color for interior
     * @param borderWidth width of border
     * @param borderColor color of border
     * @param label text for label
     * @param labelColor color for label text
     * @param labelSize size of label text
     */
    constructor(props: RectangleProps);
    boundingBox(): BoundingBox;
    setWidth(width: number | (() => number)): void;
    setHeight(height: number | (() => number)): void;
    render(svg: any): void;
}
//# sourceMappingURL=Rectangle.d.ts.map