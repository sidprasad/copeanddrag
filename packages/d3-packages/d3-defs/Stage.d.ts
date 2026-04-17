import { VisTree } from './Tree';
import { VisualObject } from './VisualObject';
export declare class Stage {
    Children: VisualObject[];
    constructor();
    add(addObject: VisualObject): void;
    children_to_tree_recurse(root: VisualObject): VisTree;
    render(svg: any, document?: any): void;
}
//# sourceMappingURL=Stage.d.ts.map