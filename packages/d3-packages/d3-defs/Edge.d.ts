import { LineProps } from './Line';
import { TextBoxProps } from './TextBox';
import { VisualObject } from './VisualObject';
import { Coords } from './Utility';
export interface EdgeProps {
    obj1: VisualObject;
    obj2: VisualObject;
    lineProps: LineProps;
    textProps: TextBoxProps;
    textLocation: string;
}
export declare class Edge extends VisualObject {
    obj1: VisualObject;
    obj2: VisualObject;
    obj2Coords: () => Coords;
    obj1Coords: () => Coords;
    text: string | undefined;
    lineProps: LineProps;
    textProps: TextBoxProps;
    textLocation: string;
    visible_points: Coords[];
    boundary_points: Coords[];
    constructor(props: EdgeProps);
    compute_points(precision: number): void;
    opt_points(// Factor into utility? 
    target_point: Coords, obj: VisualObject, precision: number): Coords;
    makeLine(): void;
    makeText(): void;
}
/**
 * TODO:
 *  - where will the text be? "Middle" of line?
 *
 *  - Where will edge point? Thought - have bounding box "better" implemented
 *
 *    - IDEA: bounding box is given by a lambda that takes in the center of a shape. For more "complex" shapes where we actually
 *  want a "good" bounding box, we return an equation to get the bounding box for the circle. Practically, we want
 *  the arrow to point to __sorta__ the closest edge point of a given shape. But this doesn't need to be exact
 *  to look nice. Even better: a lambda that takes in a center point and a direction
 *
 */
export {};
//# sourceMappingURL=Edge.d.ts.map