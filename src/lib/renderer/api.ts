/**
 * API convenience functions for the renderer
 * 
 * This module provides high-level API functions that wrap the core setupLayout function
 * with sensible defaults and common usage patterns for both legacy and modern usage.
 */
import { setupLayout } from './layout';
import { Node, Edge, Constraint, Group, RendererConfig, LayoutDependencies } from './types';
import * as d3 from 'd3';

/**
 * Backwards-compatible wrapper for setupLayout that finds SVG in DOM
 * 
 * This function should only be used client-side. It automatically looks for
 * an SVG element with id 'svg' and an input element with id 'scaleFactor' in the DOM.
 * 
 * @param nodes - Array of nodes to layout
 * @param edges - Array of edges to render
 * @param constraints - Array of layout constraints
 * @param groups - Array of node groups
 * @param width - Layout width
 * @param height - Layout height
 * @param config - Optional partial configuration to override defaults
 * @throws Error if SVG element is not found in DOM
 */
export function setupLayoutFromDOM(
    nodes: Node[], 
    edges: Edge[], 
    constraints: Constraint[], 
    groups: Group[], 
    width: number, 
    height: number,
    config?: Partial<RendererConfig>
): void {
    // Find the SVG element in the DOM
    const svgElement = d3.select("#svg") as d3.Selection<SVGSVGElement, unknown, null, undefined>;
    if (svgElement.empty()) {
        throw new Error("SVG element with id 'svg' not found in DOM");
    }

    // Find scale factor input if it exists
    const scaleFactorInput = document.getElementById("scaleFactor") as HTMLInputElement;

    // Default configuration
    const defaultConfig: RendererConfig = {
        scaleFactor: 5,
        performanceLogging: false,
        enableGridSnap: true,
        enableOverlapMinimization: true,
        ...config
    };

    // Create dependencies object
    const dependencies: LayoutDependencies = {
        svgElement,
        scaleFactorInput: scaleFactorInput || undefined,
        config: defaultConfig
    };

    // Call the main setup function
    setupLayout(nodes, edges, constraints, groups, width, height, dependencies);
}

/**
 * Create a RendererConfig with custom scale factor change handler
 * 
 * @param scaleFactor - Initial scale factor (default: 5)
 * @param onScaleFactorChange - Optional callback when scale factor changes
 * @param options - Additional configuration options
 * @returns Complete RendererConfig object
 */
export function createRendererConfig(
    scaleFactor: number = 5,
    onScaleFactorChange?: (scaleFactor: number) => void,
    options?: Partial<RendererConfig>
): RendererConfig {
    return {
        scaleFactor,
        onScaleFactorChange,
        performanceLogging: false,
        enableGridSnap: true,
        enableOverlapMinimization: true,
        ...options
    };
}

/**
 * Setup layout with custom SVG element and configuration
 * 
 * This is the preferred way to use the renderer in new code as it allows
 * full control over the SVG element and configuration.
 * 
 * @param svgElement - D3 selection of the SVG element to render into
 * @param nodes - Array of nodes to layout
 * @param edges - Array of edges to render
 * @param constraints - Array of layout constraints
 * @param groups - Array of node groups
 * @param width - Layout width
 * @param height - Layout height
 * @param config - Renderer configuration
 * @param scaleFactorInput - Optional scale factor input element
 */
export function setupLayoutWithConfig(
    svgElement: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    nodes: Node[], 
    edges: Edge[], 
    constraints: Constraint[], 
    groups: Group[], 
    width: number, 
    height: number,
    config: RendererConfig,
    scaleFactorInput?: HTMLInputElement
): void {
    const dependencies: LayoutDependencies = {
        svgElement,
        scaleFactorInput,
        config
    };

    setupLayout(nodes, edges, constraints, groups, width, height, dependencies);
}
