import { VisualObject, Coords } from './VisualObject';
export interface Node {
    name: string;
    neighbors: string[];
}
export declare class Graph extends VisualObject {
    nodes: Node[];
    node_radius: number;
    fixed_nodes: number;
    graph_dimensions: number;
    node_to_location: any;
    constructor(coords?: Coords, graph_dimensions?: number, fixed_nodes?: number, node_radius?: number);
    setCenter(center: Coords): void;
    center(): {
        x: any;
        y: any;
    };
    add(Nodes: Node[]): void;
    private set_fixed_nodes;
    private set_malleable_nodes;
    check_add_set(Nodes: Node[]): void;
    render(svg: any): void;
    render_lines(svg: any, connections: string[][]): void;
    render_nodes(svg: any): void;
}
//# sourceMappingURL=Graph.d.ts.map