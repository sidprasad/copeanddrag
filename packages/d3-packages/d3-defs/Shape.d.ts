import { VisualObject } from './VisualObject';
import { Coords } from './Utility';
import { TextBox } from './TextBox';
export interface ShapeProps {
    center?: Coords | (() => Coords);
    color?: string | (() => string);
    borderWidth?: number | (() => number);
    borderColor?: string | (() => string);
    label?: string | (() => string);
    labelColor?: string | (() => string);
    labelSize?: number | (() => number);
    opacity?: number | (() => number);
}
/**
 * Generic class for a large suite of "shape"-like objects.
 * Generally includes anything with an inside and an outside.
 * All shapes come with builtin label.
 */
export declare class Shape extends VisualObject {
    color: () => string;
    borderWidth: () => number;
    borderColor: () => string;
    opacity: () => number;
    label: TextBox;
    /**
     * Constructs a generic shape object. This is a top-level class,
     * which should not be used except as super class for other specific
     * shapes.
     * @param coords coordinates of the shape
     * @param color color of shape's interior
     * @param borderWidth width of Shape's border
     * @param borderColor color of border
     * @param label text to display atop the shape
     * @param labelColor color of text
     * @param labelSize size of text
     * @param style
     */
    constructor(props: ShapeProps);
    setColor(color: string | (() => string)): void;
    setBorderWidth(borderWidth: number | (() => number)): void;
    setBorderColor(borderColor: string | (() => string)): void;
    setLabelText(text: string | (() => string)): void;
    setLabelColor(labelColor: string | (() => string)): void;
    setLabelSize(labelSize: number | (() => number)): void;
}
//# sourceMappingURL=Shape.d.ts.map