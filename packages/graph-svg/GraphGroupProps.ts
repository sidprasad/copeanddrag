import { Edge, Graph, PositionedNode } from '@graph-ts/graph-lib';
import { CSSProperties } from 'react';
import { Matrix } from 'transformation-matrix';
import {
  Dict,
  EdgeLabelDef,
  LabelDef,
  PathDef,
  ShapeDef
} from './components/types';

export type GraphUpdateCallback = <N extends PositionedNode, E extends Edge>(
  graph: Graph<N, E>
) => void;
export type HoverUpdateCallback = (id: string | null) => void;
export type SelectionUpdateCallback = (
  nodeIDs: string[],
  edgeIDs: string[]
) => void;

export type Interactions =
  | boolean
  | {
      drag: boolean;
      zoom: boolean;
      spread: boolean;
    };

export type Selections =
  | boolean
  | {
      nodes: boolean;
      edges: boolean;
    };

export interface GraphGroupProps<N extends PositionedNode, E extends Edge> {
  graph: Graph<N, E>;
  svg: SVGSVGElement;
  defaultEdgeStyle?: CSSProperties;
  defaultEdgeStyleHovered?: CSSProperties;
  defaultEdgeStyleSelected?: CSSProperties;
  defaultNodeStyle?: CSSProperties;
  defaultNodeStyleHovered?: CSSProperties;
  defaultNodeStyleSelected?: CSSProperties;
  defaultPath?: PathDef;
  defaultShape?: ShapeDef;
  edgeLabels?: Record<string, EdgeLabelDef[]>;
  edgePaths?: Record<string, PathDef>;
  edgeStyles?: Dict<CSSProperties>;
  edgeStylesHovered?: Dict<CSSProperties>;
  edgeStylesSelected?: Dict<CSSProperties>;
  interactions?: Interactions;
  nodeLabels?: Dict<LabelDef[]>;
  nodeShapes?: Dict<ShapeDef>;
  nodeStyles?: Dict<CSSProperties>;
  nodeStylesHovered?: Dict<CSSProperties>;
  nodeStylesSelected?: Dict<CSSProperties>;
  onEdgeHovered?: HoverUpdateCallback;
  onGraphDidUpdate?: GraphUpdateCallback;
  onNodeHovered?: HoverUpdateCallback;
  onSelectionDidUpdate?: SelectionUpdateCallback;
  selections?: Selections;
  targetSpread?: Matrix;
  targetZoom?: Matrix;
  waypointStyle?: CSSProperties;
  waypointStyleHovered?: CSSProperties;
  waypointStyleSelected?: CSSProperties;
  zoomScaleFactor?: number;
}
