import { Coords } from './Utility';
import { VisualObject } from "./VisualObject";
/**
 * This class is not currently being used!!
 */
export declare class ConjoinedObject extends VisualObject {
    /**
     * Note: this code is untested!
     */
    children: VisualObject[];
    constructor(Children?: VisualObject[]);
    addOrdered(obj: VisualObject, index: number): void;
    add(obj: VisualObject): void;
    setCenter(coords: Coords): void;
    render(svg: any): void;
}
//# sourceMappingURL=ConjoinedObject.d.ts.map