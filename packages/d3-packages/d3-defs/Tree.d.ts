import { VisualObject } from './VisualObject';
import { Coords } from "./Utility";
/**
 * Interface for node in a tree with a visualObject
 */
export interface VisTree {
    visualObject: VisualObject;
    children: VisTree[];
}
export interface TreeProps {
    root: VisTree;
    height: number;
    width: number;
    coords?: Coords | (() => Coords);
    edgeColor?: string;
    edgeWidth?: number;
}
export declare class Tree extends VisualObject {
    root: VisTree;
    height: number;
    width: number;
    private lines;
    private subTrees;
    private coords;
    /**
     * Builds a tree object, pulling all children nodes into proper locations and
     * adding lines where necessary.
     * @param root root of the tree of visual objects
     * @param height height of box to bound the tree
     * @param width width of box to bound the tree
     * @param coords top left point of the tree
     */
    constructor(props: TreeProps);
    private setUpSubtrees;
    setLineColor(color: string): void;
    setLineWidth(width: number): void;
}
//# sourceMappingURL=Tree.d.ts.map