import { VisualObject } from './VisualObject';
import { BoundingBox, Coords } from './Utility';
export interface LineProps {
    points?: Coords[] | (() => Coords)[];
    arrow?: boolean;
    color?: string | (() => string);
    width?: number | (() => number);
    opacity?: number | (() => number);
    style?: string | (() => string);
}
export declare class Line extends VisualObject {
    pointsRelative: (() => Coords)[];
    color: () => string;
    width: () => number;
    opacity: () => number;
    arrow: boolean;
    style: () => string;
    /**
     * Creates a line on the given poitns.
     * @param points list of points for the line to pass through
     * @param color color of line
     * @param width width of line
     * @param opacity of the line
     */
    constructor(props: LineProps);
    boundingBox(): BoundingBox;
    setColor(color: string | (() => string)): void;
    setWidth(width: number | (() => number)): void;
    setOpacity(opacity: number | (() => number)): void;
    render(svg: any): void;
}
//# sourceMappingURL=Line.d.ts.map