import { Vector2 } from '@graph-ts/vector2';
import React, { CSSProperties } from 'react';

// General
export interface Dict<T> { [key: string]: T }


// Nodes
export interface BoundNodeID { nodeID: string }
export interface BoundNodeIDs { nodeIDs: string[] }


// Edges
export interface BoundEdgeID { edgeID: string }
export interface BoundEdgeIDs { edgeIDs: string[] }


// Waypoints
export interface BoundWaypointID { waypointID: string }


// Ports
export type PortDef = Vector2 & { id: string }
export type PortSet = Dict<PortDef>;


// Shapes
export type CircleDef = {
    shape: 'circle',
    radius: number | string
}
export type RectangleDef = {
    shape: 'rectangle',
    width: number | string
    height: number | string
};
export type ShapeDef = (CircleDef | RectangleDef) & {
    ports?: PortSet
};


// Paths
export type BSplineDef =    { type: 'bspline' }
export type BundleDef =     { type: 'bundle', beta?: number }
export type CardinalDef =   { type: 'cardinal', tension?: number }
export type CatmullRomDef = { type: 'catmullrom', alpha?: number }
export type LineDef =       { type: 'line' }
export type MonotoneXDef =  { type: 'monotonex' }
export type MonotoneYDef =  { type: 'monotoney' }
export type NaturalDef =    { type: 'natural' }
export type StepDef =       { type: 'step' }
export type StepAfterDef =  { type: 'stepafter' }
export type StepBeforeDef = { type: 'stepbefore' }
export type CurveDef =
    BSplineDef | BundleDef | CardinalDef |
    CatmullRomDef | LineDef | MonotoneXDef |
    MonotoneYDef | NaturalDef | StepDef |
    StepAfterDef | StepBeforeDef;
export type PathDef = CurveDef & {
    sourcePort?: string
    targetPort?: string
    waypoints?: Vector2[]
};
export type PathDefResolved = CurveDef & {
    points: Vector2[]
}


// Labels
export type LabelDef = {
    text: string
    props?: React.SVGProps<SVGTextElement>
    style?: CSSProperties
};

/**
 * A number in the range [0, 1] which describes a point at some
 * percentage along the total length of the path, or an object
 * that describes an absolute distance in pixels along the path,
 * starting at either the source or target.
 */
export type EdgeLabelPosition = number | {
    distance: number
    from: 'source' | 'target'
}

/**
 * A LabelDef with an optional EdgeLabelPosition that describes
 * where along an edge's path the label should be placed.
 */
export type EdgeLabelDef = LabelDef & {
    position?: EdgeLabelPosition
}


// Styles
export interface Styled { style: CSSProperties }
export interface DynamicStyles {
    style: CSSProperties
    hovered: CSSProperties
    selected: CSSProperties
}


// Mouse Events
export type BoundMouseEvent = { event: MouseEvent };
export type NodeMouseEvent = BoundNodeID & BoundMouseEvent;
export type EdgeMouseEvent = BoundEdgeID & BoundMouseEvent;
export type WaypointMouseEvent = BoundWaypointID & BoundMouseEvent;