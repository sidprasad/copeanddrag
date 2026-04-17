import { Graph, PositionedNode, RoutedEdge } from '@/graph-lib';
import { GraphProps } from './types';

export interface GraphGroupProps<N extends PositionedNode, E extends RoutedEdge>
  extends GraphProps {
  graph: Graph<N, E>;
  onClickNode?: (nodeId: string) => void;
  onHoverNode?: (nodeId: string | null) => void;
}
