import { CSSProperties } from 'react';

/**
 * Given the style used to render a path, return the color that
 * should be used to render the arrowhead.
 * @param style A style object
 */
export function arrowheadColor (style: CSSProperties): string {
    return style.stroke || 'none';
}

/**
 * Given the style used to render a path, generate an arrowhead
 * ID that can be used to define the arrowhead.
 * @param style A style object
 */
export function arrowheadID (style: CSSProperties): string {
    return `arrow[${arrowheadColor(style)}]`;
}