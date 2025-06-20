/**
 * Type definitions for the renderer module
 * 
 * This module contains all the core type definitions used throughout the rendering system,
 * including nodes, edges, constraints, and configuration types.
 */
import * as d3 from 'd3';

/**
 * Represents an edge connection between two nodes in the graph
 * 
 * @interface Edge
 * @property {string} id - Unique identifier for the edge
 * @property {Node} source - The source node of the edge
 * @property {Node} target - The target node of the edge
 * @property {string} [relName] - Optional relation name for the edge
 */
export interface Edge {
    id: string;
    source: Node;
    target: Node;
    relName?: string;
    [key: string]: any;
}

/**
 * Represents a node in the graph with position and size information
 * 
 * @interface Node
 * @property {string} id - Unique identifier for the node
 * @property {string} [name] - Optional display name for the node
 * @property {number} [x] - X coordinate position
 * @property {number} [y] - Y coordinate position
 * @property {number} [width] - Width of the node
 * @property {number} [height] - Height of the node
 * @property {Record<string, any>} [attributes] - Additional node attributes
 * @property {any} [innerBounds] - WebCola inner bounds information
 * @property {any} [bounds] - WebCola bounds information
 */
export interface Node {
    id: string;
    name?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    attributes?: Record<string, any>;
    innerBounds?: any; // WebCola bounds type
    bounds?: any; // WebCola bounds type
    [key: string]: any;
}

/**
 * Represents a layout constraint used by WebCola
 * 
 * @interface Constraint
 * @property {string} type - The type of constraint (e.g., 'separation', 'alignment')
 * @property {number} [gap] - Optional gap distance for separation constraints
 */
export interface Constraint {
    type: string;
    gap?: number;
    [key: string]: any;
}

/**
 * Represents a group of nodes for hierarchical layout
 * 
 * @interface Group
 * @property {string} [id] - Optional unique identifier for the group
 * @property {Node[]} leaves - Array of nodes that belong to this group
 * @property {any} [bounds] - WebCola bounds information for the group
 * @property {number} [padding] - Padding around the group content
 * @property {number} [keyNode] - Index of the key node in the group
 */
export interface Group {
    id?: string;
    leaves: Node[];
    bounds?: any; // WebCola bounds type
    padding?: number;
    keyNode?: number;
    [key: string]: any;
}

/**
 * Represents a 2D point with x and y coordinates
 * 
 * @interface Point
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * Represents a rectangle with position and dimensions
 * 
 * @interface Rectangle
 * @property {number} x - X coordinate of the top-left corner
 * @property {number} y - Y coordinate of the top-left corner
 * @property {number} width - Width of the rectangle
 * @property {number} height - Height of the rectangle
 */
export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Represents a bounding box with position and dimensions
 * 
 * @interface BoundingBox
 * @property {number} x - X coordinate of the top-left corner
 * @property {number} y - Y coordinate of the top-left corner
 * @property {number} width - Width of the bounding box
 * @property {number} height - Height of the bounding box
 */
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Represents group indices for layout operations
 * 
 * @interface GroupIndices
 * @property {number} groupOnIndex - Index for groupOn operation
 * @property {number} addToGroupIndex - Index for addToGroup operation
 */
export interface GroupIndices {
    groupOnIndex: number;
    addToGroupIndex: number;
}

/**
 * Result of scaling constraints operation
 * 
 * @interface ScaledConstraintsResult
 * @property {Constraint[]} scaledConstraints - Array of scaled constraints
 * @property {number} linkLength - Calculated link length
 */
export interface ScaledConstraintsResult {
    scaledConstraints: Constraint[];
    linkLength: number;
}

/**
 * Position information for text labels
 * 
 * @interface LabelPosition
 * @property {number} dx - X offset for the label
 * @property {number | string} dy - Y offset for the label (can be numeric or string like "0.35em")
 * @property {string} textAnchor - Text anchor position ("start", "middle", "end")
 */
export interface LabelPosition {
    dx: number;
    dy: number | string;
    textAnchor: string;
}

/**
 * WebCola layout interface (simplified version of the actual WebCola layout)
 * 
 * @interface ColaLayout
 */
export interface ColaLayout {
    /** Set the nodes for the layout */
    nodes(nodes: Node[]): ColaLayout;
    /** Set the links (edges) for the layout */
    links(links: Edge[]): ColaLayout;
    /** Set the constraints for the layout */
    constraints(constraints: Constraint[]): ColaLayout;
    /** Set the groups for the layout */
    groups(groups: Group[]): ColaLayout;
    /** Set the group compactness factor */
    groupCompactness(value: number): ColaLayout;
    /** Set the link distance */
    linkDistance(distance: number): ColaLayout;
    /** Set the convergence threshold */
    convergenceThreshold(value: number): ColaLayout;
    /** Set whether to avoid overlaps */
    avoidOverlaps(value: boolean): ColaLayout;
    /** Set whether to handle disconnected components */
    handleDisconnected(value: boolean): ColaLayout;
    /** Set the size of the layout area */
    size(size: [number, number]): ColaLayout;
    /** Start the layout with iteration parameters */
    start(
        unconstrainedIterations?: number,
        userConstraintIterations?: number,
        allConstraintsIterations?: number,
        gridSnapIterations?: number
    ): ColaLayout;
    /** Register event listeners */
    on(event: string, callback: () => void): ColaLayout;
    /** Route an edge (implementation-specific) */
    routeEdge(edge: any, ...args: any[]): any;
}

/**
 * D3 selection types for specific SVG elements
 */
export type SVGSelection = d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
export type GroupSelection = d3.Selection<SVGGElement, unknown, HTMLElement, any>;
export type TextSelection = d3.Selection<SVGTextElement, unknown, HTMLElement, any>;
export type PathSelection = d3.Selection<SVGPathElement, unknown, HTMLElement, any>;

/**
 * HTML input element with value property
 * 
 * @interface HTMLInputElementWithValue
 * @extends HTMLElement
 * @property {string} value - The value of the input element
 */
export interface HTMLInputElementWithValue extends HTMLElement {
    value: string;
}

/**
 * SVG path element with additional methods for path operations
 * 
 * @interface SVGPathElementWithMethods
 * @extends Element
 */
export interface SVGPathElementWithMethods extends Element {
    /** Get the total length of the path */
    getTotalLength(): number;
    /** Get a point at a specific length along the path */
    getPointAtLength(length: number): { x: number; y: number };
}

/**
 * Configuration for the renderer
 * 
 * @interface RendererConfig
 * @property {number} scaleFactor - Scale factor for layout calculations
 * @property {function} [onScaleFactorChange] - Optional callback when scale factor changes
 * @property {boolean} [performanceLogging] - Enable performance logging
 * @property {boolean} [enableGridSnap] - Enable grid snapping
 * @property {boolean} [enableOverlapMinimization] - Enable overlap minimization
 */
export interface RendererConfig {
    scaleFactor: number;
    onScaleFactorChange?: (scaleFactor: number) => void;
    performanceLogging?: boolean;
    enableGridSnap?: boolean;
    enableOverlapMinimization?: boolean;
}

/**
 * Dependencies required for layout operations
 * 
 * @interface LayoutDependencies
 * @property {d3.Selection} svgElement - D3 selection of the SVG element
 * @property {HTMLInputElement} [scaleFactorInput] - Optional scale factor input element
 * @property {RendererConfig} config - Renderer configuration
 */
export interface LayoutDependencies {
    svgElement: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    scaleFactorInput?: HTMLInputElement;
    config: RendererConfig;
}
