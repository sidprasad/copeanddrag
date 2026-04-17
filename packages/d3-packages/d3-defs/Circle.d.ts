import { Shape, ShapeProps } from './Shape';
import { BoundingBox } from './Utility';
import { BoundingBoxGenerator } from './VisualObject';
export interface CircleProps extends ShapeProps {
    radius: number | (() => number);
}
export declare class Circle extends Shape {
    radius: () => number;
    bounding_box_lam: BoundingBoxGenerator;
    /**
     * Creates a circle object at the given location
     * @param radius radius of circle
     * @param coords coordinates of circle's center
     * @param color color of interior
     * @param borderWidth width border
     * @param borderColor color for border
     * @param label text for label
     * @param labelColor color of label
     * @param labelSize size of label
     */
    constructor(props: CircleProps);
    boundingBox(): BoundingBox;
    setRadius(radius: number | (() => number)): void;
    render(svg: any): void;
}
//# sourceMappingURL=Circle.d.ts.map