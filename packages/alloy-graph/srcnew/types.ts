import { AlloyAtom, AlloyRelation, AlloyTuple } from '@/alloy-instance';
import { Edge, Graph, Node, PositionedNode, RoutedEdge } from '@/graph-lib';
import { Vector2 } from '@/vector2';

export type AlloyNode = Node & { atom: AlloyAtom };
export type AlloyEdge = Edge & { relation: AlloyRelation; tuple: AlloyTuple };
export type AlloyGraph = Graph<AlloyNode, AlloyEdge>;
export type AlloyGraphPositioned = Graph<
  AlloyNode & PositionedNode,
  AlloyEdge & RoutedEdge
>;

export type GraphLayout = {
  nodePositions: Record<string, Vector2>;
  edgeWaypoints: Record<string, Vector2[]>;
};

export type GraphLayoutSettings = {
  nodeWidth: number;
  nodeHeight: number;
  nodeSep: number;
  rankSep: number;
};
