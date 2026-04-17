import { Coords, BoundingBox } from "./Utility";
/**
 * To anyone adding to this library in the future: please take the following steps when adding
 * new VisualObjects.
 *
 * 1. If the object is to be accessible within sterling, add it to library within ScriptViewImports.
 * 2. Add the name of the file, minus .d.ts, to the list within d3lib-def-compiler/src/D3LibDefCompiler.java.
 *    Make sure to add the name to the end of the list, following any files it imports.
 * 3. Run the typescript compiler ("tsc" in terminal) from within the d3-packages folder.
 * 4. Run the main method within D3LibDefCompiler.
 *
 * If these steps are not followed, the file's definitions will either not be accessible within
 * sterling, or will not show up in monaco.
 */
export declare type BoundingBoxGenerator = (r: number) => Coords;
export declare class VisualObject {
    center: () => Coords;
    children: VisualObject[];
    dependents: VisualObject[];
    bounding_box_lam: BoundingBoxGenerator;
    hasBoundingBox: boolean;
    /**
     * Top level class, which all other visual objects will extend.
     * @param coords position of the object on screen.
     */
    constructor(coords?: Coords | (() => Coords));
    boundingBox(): BoundingBox;
    getChildren(): VisualObject[];
    /**
     * Shifts object to have new given center
     * @param center new center of the object
     */
    setCenter(center: Coords | (() => Coords)): void;
    hasLam(): Boolean;
    getLam(): BoundingBoxGenerator;
    /**
     * Renders the object to the screen.
     * @param svg HTML Svg object to which the object should be rendered.
     */
    render(svg: any): void;
}
//# sourceMappingURL=VisualObject.d.ts.map