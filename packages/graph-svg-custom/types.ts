import { PositionedGraph } from '@/graph-lib';
import { Vector2 } from '@/vector2';
import { CSSProperties, SVGProps } from 'react';

// Labels
export type LabelDef = {
  text: string;
  props?: SVGProps<SVGTextElement>;
  style?: CSSProperties;
};

/**
 * A number in the range [0, 1] which describes a point at some
 * percentage along the total length of the path, or an object
 * that describes an absolute distance in pixels along the path,
 * starting at either the source or target.
 */
export type EdgeLabelPosition =
  | number
  | {
      distance: number;
      from: 'source' | 'target';
    };

/**
 * A LabelDef with an optional EdgeLabelPosition that describes
 * where along an edge's path the label should be placed.
 */
export type EdgeLabelDef = LabelDef & {
  position?: EdgeLabelPosition;
};

export type NodeLabelDef = LabelDef & {
  offset?: Vector2;
};

// Shapes
export type CircleDef = {
  shape: 'circle';
  radius: number;
};

export type RectangleDef = {
  shape: 'rectangle';
  width: number;
  height: number;
};

export type ShapeDef = CircleDef | RectangleDef;

// Curves
export type BSplineDef = { type: 'bspline' };
export type BundleDef = { type: 'bundle'; beta?: number };
export type CardinalDef = { type: 'cardinal'; tension?: number };
export type CatmullRomDef = { type: 'catmullrom'; alpha?: number };
export type LineDef = { type: 'line' };
export type MonotoneXDef = { type: 'monotonex' };
export type MonotoneYDef = { type: 'monotoney' };
export type NaturalDef = { type: 'natural' };
export type StepDef = { type: 'step' };
export type StepAfterDef = { type: 'stepafter' };
export type StepBeforeDef = { type: 'stepbefore' };
export type CurveDef =
  | BSplineDef
  | BundleDef
  | CardinalDef
  | CatmullRomDef
  | LineDef
  | MonotoneXDef
  | MonotoneYDef
  | NaturalDef
  | StepDef
  | StepAfterDef
  | StepBeforeDef;

// Nodes
export type NodeDef = {
  id: string;
  position: Vector2;
  shape: ShapeDef;
  style: CSSProperties;
  labels?: NodeLabelDef[];
  superscripts?: NodeLabelDef[];
};

// Edges
export type EdgeDef = {
  id: string;
  path: Vector2[];
  curve: CurveDef;
  style: CSSProperties;
  labels?: EdgeLabelDef[];
};

// Arrowheads
export type ArrowDef = {
  size: number;
  color?: string;
};

// The components required to render a graph
export type GraphProps = {
  id: string;
  graph: PositionedGraph;
  nodeShapes: Record<string, ShapeDef>;
  nodeStyles: Record<string, CSSProperties>;
  nodeLabels?: Record<string, NodeLabelDef[]>;
  nodeSuperscripts?: Record<string, NodeLabelDef[]>;
  edgeCurves: Record<string, CurveDef>;
  edgeStyles: Record<string, CSSProperties>;
  edgeLabels?: Record<string, EdgeLabelDef[]>;
};
