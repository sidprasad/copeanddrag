import { AlloyAtom, AlloyTuple } from '@/alloy-instance';
import { Graph, PositionedNode, RoutedEdge } from '@/graph-lib';

export type AlloyNode = PositionedNode & { atom: AlloyAtom };
export type AlloyEdge = RoutedEdge & { relation: string; tuple: AlloyTuple };
export type AlloyGraph = Graph<AlloyNode, AlloyEdge>;
