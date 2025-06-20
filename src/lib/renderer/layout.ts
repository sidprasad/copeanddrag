import * as d3 from 'd3';
import * as cola from 'webcola';
import { 
    Node, 
    Edge, 
    Constraint, 
    Group, 
    ColaLayout,
    SVGSelection,
    GroupSelection,
    PathSelection,
    Point,
    RendererConfig,
    LayoutDependencies
} from './types';
import { 
    adjustLinkLengthsAndSeparationConstraintsToScaleFactor,
    getGroupOnAndAddToGroupIndices,
    getContainingGroups,
    adjustPointToRectanglePerimeter,
    initialUnconstrainedIterations,
    initialUserConstraintIterations,
    initialAllConstraintsIterations,
    gridSnapIterations,
    margin
} from './utils';
import { 
    setupScaleFactorListener,
    getScaleFactorFromDOM,
    getPathMidpoint,
    showRuntimeError,
    minimizeOverlap,
    isOverlapping,
    sendTimingData
} from './dom-utils';

/**
 * Check if an edge is an alignment edge
 */
function isAlignmentEdge(edge: Edge): boolean {
    return edge.id.startsWith("_alignment_");
}

/**
 * Calculate curvature for edges between the same nodes
 */
function calculateCurvature(edges: Edge[], fromNode: string, toNode: string, edgeId: string): number {
    if (edgeId.startsWith("_alignment_")) {
        return 0;
    }

    // Get all edges between the two nodes, regardless of direction
    const allEdges = edges.filter(edge => { 
        return !isAlignmentEdge(edge) && (
            (edge.source.id === fromNode && edge.target.id === toNode) ||
            (edge.source.id === toNode && edge.target.id === fromNode)
        );
    });

    const edgeCount = allEdges.length;
    const index = allEdges.findIndex(edge => edge.id === edgeId);

    // Calculate curvature
    let curvature = 0;
    if (edgeCount > 1) {
        curvature = (index % 2 === 0 ? 1 : -1) * (Math.floor(index / 2) + 1) * 0.15 * edgeCount;
    }

    return curvature;
}

/**
 * Get the dominant direction of an edge based on angle
 */
function getDominantDirection(angle: number): 'right' | 'up' | 'left' | 'down' | null {
    // Normalize angle between -π and π
    angle = ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;

    if (angle >= -Math.PI / 4 && angle <= Math.PI / 4) {
        return 'right';
    } else if (angle > Math.PI / 4 && angle < 3 * Math.PI / 4) {
        return 'up';
    } else if (angle >= 3 * Math.PI / 4 || angle <= -3 * Math.PI / 4) {
        return 'left';
    } else if (angle > -3 * Math.PI / 4 && angle < -Math.PI / 4) {
        return 'down';
    }
    return null;
}

/**
 * Find the closest point on a rectangle to a given point
 */
function closestPointOnRect(bounds: any, point: Point): Point {
    const { x, y, X, Y } = bounds;
    
    const left = x;
    const right = X;
    const top = y;
    const bottom = Y;

    const closestX = Math.max(left, Math.min(point.x, right));
    const closestY = Math.max(top, Math.min(point.y, bottom));

    if (closestX !== left && closestX !== right && 
        closestY !== top && closestY !== bottom) {
        console.log("Point is inside the rectangle", bounds, closestX, closestY);
    }

    return { x: closestX, y: closestY };
}

/**
 * Setup the main layout function
 */
export function setupLayout(
    nodes: Node[], 
    edges: Edge[], 
    constraints: Constraint[], 
    groups: Group[], 
    width: number, 
    height: number,
    dependencies: LayoutDependencies
): void {
    let edgeRouteIdx = 0;
    
    // Start measuring client-side execution time
    const clientStartTime = performance.now();
    
    // Extract dependencies
    const { svgElement, scaleFactorInput, config } = dependencies;
    const { scaleFactor, onScaleFactorChange, performanceLogging = false } = config;

    // Create a zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on("zoom", zoomed);

    function zoomed(event: any): void {
        svgElement.select(".zoomable").attr("transform", event.transform);
    }

    function getNodeIndex(nodeId: string): number {
        return nodes.findIndex(node => node.id === nodeId);
    }

    const LINK_DISTANCE = Math.min(width, height) / Math.sqrt(nodes.length);

    // Set node names
    nodes.forEach(function (node) {
        node.name = node.id;
    });

    const svg_top = svgElement.call(zoom);
    const svg = svgElement.select(".zoomable") as GroupSelection;

    const colaLayout = (cola as any).d3adaptor(d3)
        .convergenceThreshold(1e-3)
        .avoidOverlaps(true)
        .handleDisconnected(true)
        .size([width, height]) as ColaLayout;

    // Setup scale factor handling
    let { scaledConstraints, linkLength } = adjustLinkLengthsAndSeparationConstraintsToScaleFactor(constraints, scaleFactor);

    // Setup scale factor change listener if provided
    if (onScaleFactorChange && scaleFactorInput) {
        scaleFactorInput.addEventListener('input', () => {
            const newScaleFactor = parseFloat(scaleFactorInput.value) || scaleFactor;
            onScaleFactorChange(newScaleFactor);
            
            const result = adjustLinkLengthsAndSeparationConstraintsToScaleFactor(constraints, newScaleFactor);
            scaledConstraints = result.scaledConstraints;
            linkLength = result.linkLength;

            if (performanceLogging) {
                console.log("Link length", linkLength);
                console.log("Scaled constraints", scaledConstraints);
            }
            
            // Update the layout with new values
            colaLayout.linkDistance(linkLength);
            colaLayout.constraints(scaledConstraints)
                .start(
                    initialUnconstrainedIterations,
                    initialUserConstraintIterations,
                    initialAllConstraintsIterations,
                    gridSnapIterations
                )
                .on("end", routeEdges);
        });
    }

    // Configure cola layout
    colaLayout
        .nodes(nodes)
        .links(edges)
        .constraints(scaledConstraints)
        .groups(groups)
        .groupCompactness(1e-3)
        .linkDistance(linkLength);

    const lineFunction = d3.line<Point>()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveBasis);

    // This will be set during the rendering setup
    let link: PathSelection;

    const routeEdges = function (): void {
        try {
            (colaLayout as any).prepareEdgeRouting(margin / 3);
            console.log("Routing edges for the nth time", ++edgeRouteIdx);

            link.attr("d", function (this: SVGPathElement, d: Edge) {
                const edgeId = d.id;
                let route: Point[];

                try {
                    route = (colaLayout as any).routeEdge(d);

                    // Handle self-loops
                    if (d.source.id === d.target.id) {
                        const source = d.source as Node;
                        const bounds = (source as any).bounds;

                        const width = bounds.X - bounds.x;
                        const height = bounds.Y - bounds.y;

                        const startPoint = {
                            x: bounds.x + width / 2,
                            y: bounds.y
                        };
                        const endPoint = {
                            x: bounds.X,
                            y: bounds.y + height / 2
                        };

                        const selfLoopIndex = (d as any).selfLoopIndex || 0;
                        const curvatureScale = 1 + selfLoopIndex * 0.2;
                        const controlPoint = {
                            x: bounds.X + width / 2 * curvatureScale,
                            y: bounds.y - height / 2 * curvatureScale
                        };

                        route = [startPoint, controlPoint, endPoint];
                    }
                } catch (e) {
                    console.log("Error routing edge", d.id, `from ${d.source.id} to ${d.target.id}`);
                    console.error(e);

                    showRuntimeError(
                        `Runtime (WebCola) error when laying out an edge from ${d.source.id} to ${d.target.id}.`,
                        'You may have to click and drag these nodes slightly to un-stick layout.'
                    );

                    return lineFunction([
                        { x: d.source.x || 0, y: d.source.y || 0 }, 
                        { x: d.target.x || 0, y: d.target.y || 0 }
                    ]);
                }

                // Handle group edges
                if (edgeId.startsWith("_g_")) {
                    const source = d.source;
                    const target = d.target;

                    const sourceIndex = getNodeIndex(source.id);
                    const targetIndex = getNodeIndex(target.id);

                    const { groupOnIndex, addToGroupIndex } = getGroupOnAndAddToGroupIndices(edgeId);

                    const addTargetToGroup = groupOnIndex < addToGroupIndex;
                    const addSourceToGroup = groupOnIndex >= addToGroupIndex;

                    if (addTargetToGroup) {
                        const potentialGroups = getContainingGroups(groups, target);
                        const targetGroup = potentialGroups.find(group => group.keyNode === sourceIndex);
                        if (targetGroup) {
                            const newTargetCoords = closestPointOnRect((targetGroup as any).bounds, route[0]);
                            const currentTarget = route[route.length - 1];
                            currentTarget.x = newTargetCoords.x;
                            currentTarget.y = newTargetCoords.y;
                            route[route.length - 1] = currentTarget;
                        } else {
                            console.log("Target group not found", potentialGroups, targetIndex, edgeId);
                        }
                    } else if (addSourceToGroup) {
                        const potentialGroups = getContainingGroups(groups, source);
                        const sourceGroup = potentialGroups.find(group => group.keyNode === targetIndex);
                        if (sourceGroup) {
                            const newSourceCoords = closestPointOnRect(
                                (sourceGroup as any).bounds.inflate(-1), 
                                route[route.length - 1]
                            );
                            const currentSource = route[0];
                            currentSource.x = newSourceCoords.x;
                            currentSource.y = newSourceCoords.y;
                            route[0] = currentSource;
                        } else {
                            console.log("Source group not found", potentialGroups, sourceIndex, targetIndex, edgeId);
                        }
                    } else {
                        console.log("This is a group edge, but neither source nor target is a group.", d);
                    }

                    // Remove intermediate points for group edges
                    if (route.length > 2) {
                        route.splice(1, route.length - 2);
                    }
                    return lineFunction(route);
                }

                // Continue with regular edge processing...
                return processRegularEdge(d, route, edges, lineFunction);
            });

            // Update label positions after routing edges
            updateLabelPositions();

            // Zoom to fit
            zoomToFit();

            // Send timing data
            const clientEndTime = performance.now();
            const clientTime = clientEndTime - clientStartTime;
            sendTimingData(clientTime);

        } catch (error) {
            console.error("Error in routeEdges:", error);
            showRuntimeError("Error during edge routing", error.message);
        }
    };

    // Initialize the layout
    colaLayout
        .start(
            initialUnconstrainedIterations,
            initialUserConstraintIterations,
            initialAllConstraintsIterations,
            gridSnapIterations
        )
        .on("end", routeEdges);

    // Helper function to process regular (non-group) edges
    function processRegularEdge(d: Edge, route: Point[], edges: Edge[], lineFunction: d3.Line<Point>): string | null {
        // Get all non-alignment edges between the two nodes
        const allEdgesBetweenSourceAndTarget = edges.filter(edge => {
            return !isAlignmentEdge(edge) && (
                (edge.source.id === d.source.id && edge.target.id === d.target.id) ||
                (edge.source.id === d.target.id && edge.target.id === d.source.id)
            );
        });

        // Add midpoint if only two points
        if (route.length === 2) {
            const midpoint = {
                x: (route[0].x + route[1].x) / 2,
                y: (route[0].y + route[1].y) / 2
            };
            route.splice(1, 0, midpoint);
        }

        // Calculate edge direction
        const dx = route[1].x - route[0].x;
        const dy = route[1].y - route[0].y;
        const angle = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Handle multiple edges between same nodes
        if (allEdgesBetweenSourceAndTarget.length > 1) {
            const minDistance = 10;
            const edgeIndex = allEdgesBetweenSourceAndTarget.findIndex(edge => edge.id === d.id);
            const offset = (edgeIndex % 2 === 0 ? 1 : -1) * (Math.floor(edgeIndex / 2) + 1) * minDistance;

            if (route.length > 1) {
                const startIndex = 0;
                const endIndex = route.length - 1;
                const direction = getDominantDirection(angle);

                if (direction === 'right' || direction === 'left') {
                    route[startIndex].y += offset;
                    route[endIndex].y += offset;
                } else if (direction === 'up' || direction === 'down') {
                    route[startIndex].x += offset;
                    route[endIndex].x += offset;
                }

                // Adjust points to rectangle perimeter
                const source = d.source as Node;
                const target = d.target as Node;
                route[startIndex] = adjustPointToRectanglePerimeter(route[startIndex], (source as any).innerBounds);
                route[endIndex] = adjustPointToRectanglePerimeter(route[endIndex], (target as any).innerBounds);
            }
        }

        // Apply curvature
        const curvature = calculateCurvature(edges, d.source.id, d.target.id, d.id);
        route.forEach((point, index) => {
            if (index > 0 && index < route.length - 1 && curvature !== 0) {
                const offsetX = curvature * Math.abs(Math.sin(angle)) * distance;
                const offsetY = curvature * Math.abs(Math.cos(angle)) * distance;

                point.x += offsetX;
                point.y += offsetY;
            }
        });

        return lineFunction(route);
    }

    // Helper function to update label positions
    function updateLabelPositions(): void {
        // This would be implemented based on the specific DOM structure
        // For now, we'll leave this as a placeholder
        console.log("Updating label positions...");
    }

    // Helper function to zoom to fit
    function zoomToFit(): void {
        const bbox = svg.node()?.getBBox();
        if (bbox) {
            const padding = 20;
            const viewBox = [
                bbox.x - padding,
                bbox.y - padding,
                bbox.width + 2 * padding,
                bbox.height + 2 * padding
            ].join(' ');
            
            svg_top.attr('viewBox', viewBox);
        }
    }
}
