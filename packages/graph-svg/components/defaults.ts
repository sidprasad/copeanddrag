import { CSSProperties } from 'react';
import { PathDef, ShapeDef } from './types';

/**
 * Edges
 */

export const EDGE_PATH: PathDef = {
    type: 'line'
};

export const EDGE_STYLE: CSSProperties = {
    fill: 'none',
    stroke: '#333',
    strokeWidth: 1,
    strokeLinecap: 'square'
};

export const EDGE_HOVER_STYLE: CSSProperties = {
    strokeWidth: 2,
    cursor: 'pointer',
    // filter: 'drop-shadow(0 0 2px steelblue)'
};

export const EDGE_SELECTED_STYLE: CSSProperties = {
    strokeWidth: 4
};


/**
 * Nodes
 */

const r = 50;
export const NODE_SHAPE: ShapeDef = {
    shape: 'circle',
    radius: r,
    ports: {
        top: { id: 'top', x: 0, y: r },
        right: { id: 'right', x: r, y: 0 },
        bottom: { id: 'bottom', x: 0, y: -r },
        left: { id: 'left', x: -r, y: 0 }
    }
};

export const NODE_STYLE: CSSProperties = {
    stroke: '#333',
    strokeWidth: 1,
    fill: 'white'
};

export const NODE_HOVER_STYLE: CSSProperties = {
    strokeWidth: 2,
    cursor: 'pointer'
};

export const NODE_SELECTED_STYLE: CSSProperties = {
    strokeWidth: 5,
    // filter: 'drop-shadow(0 0 4px steelblue)'
}


/**
 * Waypoints
 */
export const WAYPOINT_SHAPE: ShapeDef = {
    shape: 'circle',
    radius: 3
}

export const WAYPOINT_STYLE: CSSProperties = {
    stroke: 'none',
    fill: 'coral',
    cursor: 'grab'
};

export const WAYPOINT_HOVER_STYLE: CSSProperties = {
    stroke: 'coral',
    strokeWidth: 10
};

export const WAYPOINT_SELECTED_STYLE: CSSProperties = {
    stroke: '#333',
    strokeWidth: 2
};


/**
 * Gestures, etc.
 */
export const ZOOM_FACTOR = 1.035;