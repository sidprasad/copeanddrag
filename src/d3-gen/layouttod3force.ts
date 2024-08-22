import { InstanceLayout, LayoutNode, LayoutEdge, LayoutConstraint, LayoutGroup, LeftConstraint, TopConstraint, AlignmentConstraint, isLeftConstraint, isTopConstraint, isAlignmentConstraint } from '../layout/interfaces';



const nodeWidth = 70;
const nodeHeight = 45;


// type NodeWithMetadata = Node & { id: string, attributes: Record<string, string[]>, color: string };


// type EdgeWithMetadata = {
//   source: number,
//   target: number,
//   relName: string, // This is the name of the relation for the edge
//   id: string, // Unique identifier for the edge
//   label: string // This is what is displayed on the edge
// };

// export { NodeWithMetadata, EdgeWithMetadata };

interface ForceNode {

    id: string;
    x: number;
    y: number;
    color: string;
    attributes?: Record<string, string[]>;
    height: number;
    width: number;
}

interface ForceEdge {
    source: string;
    target: string;
    id: string;
    label: string;
    relationName: string;
}

export class D3ForceLayout {

  private instanceLayout: InstanceLayout;

  private readonly DEFAULT_X: number;
  private readonly DEFAULT_Y: number;

  readonly FIG_WIDTH: number;
  readonly FIG_HEIGHT: number;

  private readonly nodes: ForceNode[];
  private readonly edges: ForceEdge[];

  constructor(instanceLayout: InstanceLayout, fig_height: number = 800, fig_width: number = 800) {


    this.FIG_HEIGHT = fig_height;
    this.FIG_WIDTH = fig_width;
    this.DEFAULT_X = fig_width / 2;
    this.DEFAULT_Y = fig_height / 2;


    this.instanceLayout = instanceLayout;
    this.nodes = instanceLayout.nodes.map(node => this.toForceNode(node));
    this.edges = instanceLayout.edges.map(edge => this.toForceEdge(edge));

  }

  private toForceNode(node: LayoutNode): ForceNode {
    return {
      id: node.id,
      x: this.DEFAULT_X,
      y: this.DEFAULT_Y,
      color: node.color,
      attributes: node.attributes,
      height: nodeHeight,
      width: nodeWidth
    };
  }

    private toForceEdge(edge: LayoutEdge): ForceEdge {
        return {
        source: edge.source.id,
        target: edge.target.id,
        id: edge.id,
        label: edge.label,
        relationName : edge.relationName
        };
    }

    // Write a translation to our forces (lefrt, right, etc)


}