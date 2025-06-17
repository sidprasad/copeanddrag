/** Constants */
const initialUnconstrainedIterations = 10; //unconstrained initial layout iterations
const initialUserConstraintIterations = 100; // initial layout iterations with user-specified constraints
const initialAllConstraintsIterations = 1000; // initial layout iterations with all constraints including non-overlap
const gridSnapIterations = 5; // iterations of "grid snap", which pulls nodes towards grid cell centers - grid of size node[0].width - only really makes sense if all nodes have the same width and heigh
const margin = 10;
const dy_for_linespacing = 5; // Adjust for spacing between lines
//////////

/**
 * Determines if an edge is an inferred edge by checking for the helper prefix.
 * @param {Object} edge - The edge object to check
 * @returns {boolean} True if the edge is an inferred edge, false otherwise
 */
function isInferredEdge(edge) {

    const helperPrefix = "_inferred_";

    // Check if the edge contains the helper prefix
    return edge.id.includes(helperPrefix);

}

/**
 * Determines if an edge is a group edge by checking for the group prefix.
 * @param {Object} edge - The edge object to check
 * @returns {boolean} True if the edge is a group edge, false otherwise
 */
function isGroupEdge(edge) {
    const groupPrefix = "_g_";
    return edge.id.startsWith(groupPrefix);
}



function adjustLinkLengthsAndSeparationConstraintsToScaleFactor(constraints, scaleFactor) {

    const adjustedScaleFactor = scaleFactor / 5;
    const min_sep = 150;
    const default_node_width = 100;

    let linkLength = (min_sep + default_node_width) / adjustedScaleFactor;



    /*
    For each constraint, if it is a separation constraint, adjust the distance by the scale factor.
    */

    // Instead of mutating the original constraints array, create a new scaled constraints array
    function getScaledConstraints(constraints) {
        return constraints.map(constraint => {
            if (constraint.type === "separation" && typeof constraint.gap === "number") {

                const oldgap = constraint.gap;
                const newgap = oldgap / adjustedScaleFactor; // or * scaleFactor, depending on your UI logic
                //console.log(`Scaling constraint gap from ${oldgap} to ${newgap} with scale factor ${adjustedScaleFactor}`);

                return {
                    ...constraint,
                    gap: newgap 
                };
            }
            return constraint;
        });
    }

    return {
        scaledConstraints: getScaledConstraints(constraints),
        linkLength: linkLength
    }
}
/**
 * Obtains the groupOn and addToGroup indices from the edge ID.
 * @param {string} edgeId - The edge ID in format "_g_{groupOnIndex}_{addToGroupIndex}_"
 * @returns {{groupOnIndex: number, addToGroupIndex: number}} Object containing the parsed indices
 * @throws {Error} If the edge ID doesn't match the expected pattern
 */
function getGroupOnAndAddToGroupIndices(edgeId) {


    // Pattern _g_${groupOn}_${addToGroup}_
    const pattern = /_g_(\d+)_(\d+)_/;
    const match = edgeId.match(pattern);
    if (match) {
        const groupOnIndex = parseInt(match[1]);
        const addToGroupIndex = parseInt(match[2]);
        return { groupOnIndex, addToGroupIndex };
    }
    else {
        throw new Error(`Edge ID ${edgeId} does not match the expected pattern.`);
    }
}

/**
 * Adjusts a point to remain on the perimeter of a rectangle with padding.
 * @param {Object} point - The point to adjust
 * @param {Object} rect - The rectangle bounds
 * @returns {Object} The adjusted point with x and y coordinates
 */
function adjustPointToRectanglePerimeter(point, rect) {
    const { x, y, width, height } = rect;
    const padding = 3; // Padding in pixels

    const tl_X = x - padding;
    const tl_Y = y - padding;
    const br_X = x + width + padding;
    const br_Y = y + height + padding;

    if (point.x < tl_X) {
        point.x = tl_X;
    }
    else if (point.x > br_X) {
        point.x = br_X;
    }

    if (point.y < tl_Y) {
        point.y = tl_Y;
    }
    else if (point.y > br_Y) {
        point.y = br_Y;
    }
    return point;
}

/**
 * Generates a random offset value for positioning elements along a path.
 * @returns {number} Random offset value between -10 and 10
 */
function getRandomOffsetAlongPath() {
    return (Math.random() - 0.5) * 20; // Random value between -10 and 10
}

/**
 * Calculates the overlapping area between two bounding boxes.
 * @param {Object} bbox1 - First bounding box
 * @param {Object} bbox2 - Second bounding box
 * @returns {number} The area of overlap between the two boxes
 */
function calculateOverlapArea(bbox1, bbox2) {
    const x_overlap = Math.max(0, Math.min(bbox1.x + bbox1.width, bbox2.x + bbox2.width) - Math.max(bbox1.x, bbox2.x));
    const y_overlap = Math.max(0, Math.min(bbox1.y + bbox1.height, bbox2.y + bbox2.height) - Math.max(bbox1.y, bbox2.y));
    return x_overlap * y_overlap;
}

/**
 * Minimizes overlap between a label and other overlapping labels by finding the best position.
 * @param {SVGTextElement} currentLabel - The label element to reposition
 * @param {SVGTextElement[]} overlapsWith - Array of labels that overlap with the current label
 */
function minimizeOverlap(currentLabel, overlapsWith) {
    const originalBBox = currentLabel.getBBox();
    let minOverlapArea = Infinity;
    let bestPosition = { dx: 0, dy: 0, textAnchor: 'middle' };

    const positions = [
        { dx: 0, dy: 0, textAnchor: 'middle' },
        { dx: 2, dy: 0, textAnchor: 'start' },
        { dx: -2, dy: 0, textAnchor: 'end' },
        { dx: 0, dy: '1em', textAnchor: 'middle' }
    ];

    positions.forEach(position => {
        let totalOverlapArea = 0;
        d3.select(currentLabel)
            .attr('dx', position.dx)
            .attr('dy', position.dy)
            .attr('text-anchor', position.textAnchor);

        const newBBox = currentLabel.getBBox();
        overlapsWith.forEach(overlapLabel => {
            const overlapBBox = overlapLabel.getBBox();
            totalOverlapArea += calculateOverlapArea(newBBox, overlapBBox);
        });

        if (totalOverlapArea < minOverlapArea) {
            minOverlapArea = totalOverlapArea;
            bestPosition = position;
        }
    });

    d3.select(currentLabel)
        .attr('dx', bestPosition.dx)
        .attr('dy', bestPosition.dy)
        .attr('text-anchor', bestPosition.textAnchor);
}

/**
 * Finds all groups that contain a given node, including nested groups.
 * @param {Object[]} groups - Array of group objects
 * @param {Object} node - The node to find containing groups for
 * @returns {Object[]} Array of all groups that contain the node
 */
function getContainingGroups(groups, node) {
    const containingGroups = [];

    function findContainingGroups(currentNode, groups, parents) {
        for (const group of groups) {
            let leaves = group.leaves.map(leaf => leaf.id);
            if (leaves.includes(currentNode.id)) {
                containingGroups.push(...parents, group);
                findContainingGroups(group, groups, [...parents, group]);
            }
        }
    }

    findContainingGroups(node, groups, []);
    return containingGroups;
}


/**
 * Main function for the renderer. Sets up the layout for the graph using D3 and WebCola.
 * @param {*} d3 
 * @param {*} nodes 
 * @param {*} edges 
 * @param {*} constraints 
 * @param {*} groups 
 * @param {*} width 
 * @param {*} height 
 */
function setupLayout(d3, nodes, edges, constraints, groups, width, height) {


    let edgeRouteIdx = 0;

    // Start measuring client-side execution time
    const clientStartTime = performance.now();



    // Create a zoom behavior
    function zoomed() {
        d3.select(".zoomable").attr("transform", d3.event.transform);
    }
    
    var zoom = d3.zoom()
        .scaleExtent([0.5, 5]) // Set the zoom scale limits
        .on("zoom", zoomed);

    // Helper function to get the index of a node by its ID
    function getNodeIndex(n) {
        const nodeId = typeof n === 'string' ? n : n.id;
        return nodes.findIndex(node => node.id === nodeId);
    }

    const LINK_DISTANCE = Math.min(width, height) / Math.sqrt(nodes.length);

    nodes.forEach(function (node) {
        node.name = node.id;
    });

    var svg_top = d3.select("#svg").call(zoom);
    var svg = d3.select(".zoomable");

    var colaLayout = cola.d3adaptor(d3)
        .convergenceThreshold(1e-3)
        .avoidOverlaps(true)
        .handleDisconnected(true)
        .size([width, height]);



    ///// Check whats up TODO ////

    // Adjust the graph by the scale factor
    let scaleFactorInput = document.getElementById("scaleFactor");
    let scaleFactor = scaleFactorInput ? parseFloat(scaleFactorInput.value) : 1;

    if (scaleFactorInput) {
        // Add an event listener to the scale factor input to update the layout when the scale factor changes
        scaleFactorInput.addEventListener("change", function () {
            scaleFactor = parseFloat(scaleFactorInput.value)    ;
            

            let { scaledConstraints, linkLength } = adjustLinkLengthsAndSeparationConstraintsToScaleFactor(constraints, scaleFactor);

            console.log("Link length", linkLength);

            colaLayout.symmetricDiffLinkLengths(linkLength);

            colaLayout.constraints(scaledConstraints)
                .start(
                    initialUnconstrainedIterations,
                    initialUserConstraintIterations,
                    initialAllConstraintsIterations,
                    gridSnapIterations)
                .on("end", function () {
                    gridify(svg, 15, margin, 5);
                });
        });
    }

    // TODO: Figure out WHEN to use flowLayout and when not to use it.
    // I think having directly above/ below makes it impossible to have flow layout 'y' *unless we have heirarchy*

    const currentScaleFactor = scaleFactorInput ? parseFloat(scaleFactorInput.value) : 1;
    let { scaledConstraints, linkLength } = adjustLinkLengthsAndSeparationConstraintsToScaleFactor(constraints, currentScaleFactor);

    colaLayout
        .nodes(nodes)
        .links(edges)
        .constraints(scaledConstraints)
        .groups(groups)
        .groupCompactness(1e-3)
        // .symmetricDiffLinkLengths(linkLength); // FIXME: The default link length is too large for small graphs
        .linkDistance(100);


    var lineFunction = d3.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; })
        .curve(d3.curveBasis);

    
    function route(nodes, groups, margin, groupMargin) {
        nodes.forEach(d => {
            d.routerNode = {
                name: d.name,
                bounds: d.bounds || d.innerBounds
            };
        });
        groups.forEach(d => {
            d.routerNode = {
                bounds: d.bounds.inflate(-groupMargin),
                children: (typeof d.groups !== 'undefined' ? d.groups.map(c=> nodes.length + c.id) : [])
                .concat(typeof d.leaves !== 'undefined' ? d.leaves.map(c=> c.index) : [])
            };
        });
        let gridRouterNodes = nodes.concat(groups).map((d, i) => {
            d.routerNode.id = i;
            return d.routerNode;
        });
        // NOTE: Router nodes are nodes needed for grid routing, which include both nodes and groups
        return new cola.GridRouter(gridRouterNodes, {
            getChildren: (v) => v.children,
            getBounds: v => v.bounds
        }, margin - groupMargin);
    }

    // NOTE: The introduction of alignment edges might be the cause of some issues when using GridRouter
    function gridify(svg, nudgeGap, margin, groupMargin) {
        console.log("Gridify");
        // Create the grid router
        var gridrouter = route(nodes, groups, margin, groupMargin);

        // Route all edges using the GridRouter
        var routes = gridrouter.routeEdges(edges, nudgeGap, function (e) { return e.source.routerNode.id; }, function (e) { return e.target.routerNode.id; });

        console.log("GridRouter routes: ", routes);

        // Clear existing paths; 
        // NOTE: This is crucial to avoid node explosion when re-routing
        svg.selectAll('.link-group').remove();

        // Create paths from GridRouter routes
        routes.forEach(function (route, index) {
            var cornerradius = 5;
            var arrowwidth = 3; // Abitrary value (see note below)
            var arrowheight = 7; // Abitrary value (see note below)

            // Get the corresponding edge data
            // Assumption: edges are in the same order as routes
            var edgeData = edges[index];

            // Calculate the route path using the GridRouter
            // NOTE: Arrow width/height not used in our implementation
            var p = cola.GridRouter.getRoutePath(route, cornerradius, arrowwidth, arrowheight);

            // Create the link groups
            const linkGroup = svg.append('g')
                .attr("class", "link-group");

            // NOTE: This is the link
            linkGroup.append('path')
                .attr("class", function () {
                    if (isAlignmentEdge(edgeData)) return "alignmentLink";
                    if (isInferredEdge(edgeData)) return "inferredLink";
                    return "link";
                })
                .attr('data-link-id', edgeData.id)
                .attr('d', p.routepath)
                .lower();
        });

        // Update node positions
        // NOTE: `transition()` gives the snap-to-grid effect
        // NOTE: Uses absolute positioning to be compatible with pre-existing code (also easier to reason)
        // NOTE: Use `d.bounds` to get the bounds of the node, `d.bounds.cx()` and `d.bounds.cy()` for center coordinates
        svg.selectAll(".node").transition()
            .attr("x", function (d) { return d.bounds.x; })
            .attr("y", function (d) { return d.bounds.y; })
            .attr("width", function (d) { return d.bounds.width(); })
            .attr("height", function (d) { return d.bounds.height(); });
        
        // Update group positions
        // var groupPadding = margin - groupMargin;
        // console.log("Group padding", groupPadding);
        svg.selectAll(".group").transition()
            .attr("x", function (d) { return d.bounds.x; })
            .attr('y', function (d) { return d.bounds.y; })
            .attr('width', function (d) { return d.bounds.width(); })
            .attr('height', function (d) { return d.bounds.height(); });
        
        // Update label positions
        svg.selectAll(".label").transition()
            .attr("x", function (d) { return d.bounds.cx(); })
            .attr("y", function (d) { return d.bounds.cy(); });
        
        // Position link labels at route midpoints
        updateLinkLabels(routes, edges);
    }

    // Helper function to update link labels
    // TODO: Improve label placement to avoid overlap with other labels
    function updateLinkLabels(routes, edges) {
        routes.forEach(function(route, index) {
            var edgeData = edges[index];
            
            // Calculate midpoint of the route
            let combinedSegment = [];
            let direction = []; // 'L' for left, 'R' for right, 'U' for up, 'D' for down
            route.forEach(function(segment) {
                combinedSegment = combinedSegment.concat(segment);
            });
            // console.log("Combined segment", combinedSegment);
            const midpointIndex = Math.floor(combinedSegment.length / 2); // NOTE: Length should be even
            const midpoint = {
                x: (combinedSegment[midpointIndex - 1].x + combinedSegment[midpointIndex].x) / 2,
                y: (combinedSegment[midpointIndex - 1].y + combinedSegment[midpointIndex].y) / 2
            };

            // TODO: Compute the direction of the angle
            // This is useful for determining where to place padding around the label
            // Currently, the label is directly on the line, which can be hard to read

            // console.log(`Midpoint for edge ${edgeData.id}:`, midpoint);
            
            // Update corresponding label
            linkGroups.filter(function(d) { return d.id === edgeData.id; })
                .select("text.linklabel")
                .attr("x", midpoint.x)
                .attr("y", midpoint.y)
                .attr("text-anchor", "middle");
        });
    }

    var routeEdges = function () {

        try {
            // Initialize WebCola's edge routing system with collision avoidance
            // colaLayout.prepareEdgeRouting(margin / 3);

            console.log("Routing edges for the nth time", ++edgeRouteIdx);

            // What I want to do is change the angle based on the number of edges between the same nodes
            // Function to calculate curvature based on number of edges and index
            // NOTE: Only applies to non-alignment edges
            function calculateCurvature(edges, fromNode, toNode, edgeid) {
                if (edgeid.startsWith("_alignment_")) {
                    return 0;
                }

                // Get all edges between the two nodes, regardless of direction
                const allEdges = edges.filter(edge => { 
                    return !isAlignmentEdge(edge) && (
                                (edge.source.id == fromNode && edge.target.id == toNode) ||
                                (edge.source.id == toNode && edge.target.id == fromNode)
                            );
                });

                const edgeCount = allEdges.length;
                let index = allEdges.findIndex(edge => edge.id == edgeid);

                // Calculate curvature: alternates positive/negative with increasing magnitude
                // Formula creates symmetric curves on both sides of the straight line
                let curvature = 0;
                if (edgeCount > 1) {
                    curvature = (index % 2 === 0 ? 1 : -1) * (Math.floor(index / 2) + 1) * 0.15 * edgeCount;
                }

                return curvature;
            }

            // Main edge drawing function - sets the SVG path 'd' attribute for each edge
            routes.forEach(function (route) {
                try {
                    
                    // SPECIAL CASE: Handle self-loops (edges from a node to itself)
                    if (d.source.id === d.target.id) {
                        const source = d.source;
    
                        // Get the bounds of the source/target node
                        const bounds = source.bounds;
    
                        // Calculate width and height from bounds
                        const width = bounds.X - bounds.x;
                        const height = bounds.Y - bounds.y;
    
                        // Define two distinct points on the bounds for the start and end of the arc
                        const startPoint = {
                            x: bounds.x + width / 2, // Center of the top edge
                            y: bounds.y
                        };
                        const endPoint = {
                            x: bounds.X, // Center of the right edge
                            y: bounds.y + height / 2
                        };
    
                        // Dynamically calculate the control point for the arc
                        const selfLoopIndex = d.selfLoopIndex || 0; // Index of the self-loop (if multiple exist)
                        const curvatureScale = 1 + selfLoopIndex * 0.2; // Scale curvature based on self-loop index
                        const controlPoint = {
                            x: bounds.X + width / 2 * curvatureScale, // Offset based on node width and scale
                            y: bounds.y - height / 2 * curvatureScale // Offset based on node height and scale
                        };
    
                        // Create a route with three points: start, control, and end
                        route = [
                            startPoint,   // Start point on the bounds
                            controlPoint, // Control point for the arc
                            endPoint      // End point on the bounds
                        ];
                    }
                } catch (e) {
                    // Handle errors when drawing edges
                    console.log("Error routing edge", d.id, `from ${d.source.id} to ${d.target.id}`);
                    console.error(e);
    
                    // Create an alert message in the runtime errors section
                    let runtimeMessages = document.getElementById("runtime_messages");
                    let dismissableAlert = document.createElement("div");
                    dismissableAlert.className = "alert alert-danger alert-dismissible fade show";
                    dismissableAlert.setAttribute("role", "alert");
                    dismissableAlert.innerHTML = `Runtime (WebCola) error when laying out an edge from ${d.source.id} to ${d.target.id}. You may have to click and drag these nodes slightly to un-stick layout.`;

                    // Make sure we don't have duplicate alerts
                    let existingAlerts = runtimeMessages.querySelectorAll(".alert");
                    existingAlerts.forEach(alert => {
                        if (alert.innerHTML === dismissableAlert.innerHTML) {
                            alert.remove();
                        }
                    });

                    runtimeMessages.appendChild(dismissableAlert);
                    // Fallback: return a simple straight line between node centers
                    return lineFunction([{ x: d.source.x, y: d.source.y }, { x: d.target.x, y: d.target.y }]);
                }
    
                // This is a special case for group edges
                // Draw edges to the closest point on the rectangle of the group
                if (n.startsWith("_g_")) {
                    let source = d.source;
                    let target = d.target;
    
                    let sourceIndex = getNodeIndex(source.id);
                    let targetIndex = getNodeIndex(target.id);
    
                    // Get the groupOn and addToGroup indices
                    let { groupOnIndex, addToGroupIndex } = getGroupOnAndAddToGroupIndices(n);
    
                    /**
                     * Helper function to find the closest point on a rectangle to a given point.
                     * @param {*} bounds 
                     * @param {*} point 
                     * @returns {{x: number, y: number}} - The closest point on the rectangle to the given point.
                     */
                    function closestPointOnRect(bounds, point) {
                        // Destructure the rectangle bounds
                        const { x, y, X, Y } = bounds;
    
                        // Calculate the rectangle's edges
                        const left = x;
                        const right = X;
                        const top = y;
                        const bottom = Y;
    
                        // Clamp the point's coordinates to the rectangle's bounds
                        const closestX = Math.max(left, Math.min(point.x, right));
                        const closestY = Math.max(top, Math.min(point.y, bottom));
    
                        if (closestX != left && closestX != right
                            && closestY != top && closestY != bottom) {
    
                            console.log("Point is inside the rectangle", bounds, closestX, closestY);
                        }
    
                        return { x: closestX, y: closestY };
                    }
    
                    // Determine which end of the edge connects to a group based on the edge ID
                    // The target of the edge is the relevant group member.
                    let addTargetToGroup = groupOnIndex < addToGroupIndex;
                    // The source of the edge is the relevant group member.
                    let addSourceToGroup = groupOnIndex >= addToGroupIndex;
    
                    if (addTargetToGroup) {
                        // Find the group that contains the target node and is keyed by the source
                        let potentialGroups = getContainingGroups(groups, target);
                        let targetGroup = potentialGroups.find(group => group.keyNode === sourceIndex);
                        if (targetGroup) {
                            // Adjust the endpoint to the closest point on the group boundary
                            let newTargetCoords = closestPointOnRect(targetGroup.bounds, route[0]);
                            let currentTarget = route[route.length - 1];
                            currentTarget.x = newTargetCoords.x;
                            currentTarget.y = newTargetCoords.y;
                            route[route.length - 1] = currentTarget;
                        }
                        else {
                            console.log("Target group not found", potentialGroups, targetIndex, n);
                        }
                    }
                    else if (addSourceToGroup) {
                        // Find the group that contains the source node and is keyed by the target
                        let potentialGroups = getContainingGroups(groups, source);
                        let sourceGroup = potentialGroups.find(group => group.keyNode === targetIndex);
                        if (sourceGroup) {
                            // Adjust the startpoint to the closest point on the group boundary
                            let newSourceCoords = closestPointOnRect(sourceGroup.bounds.inflate(-1), route[route.length - 1]);
                            let currentSource = route[0];
                            currentSource.x = newSourceCoords.x;
                            currentSource.y = newSourceCoords.y;
                            route[0] = currentSource;
                        }
                        else {
                            console.log("Source group not found", potentialGroups, sourceIndex, targetIndex, n);
                        }
    
                    }
                    else {
                        console.log("This is a group edge, but neither source nor target is a group.", d);
                    }
    
                    // Not ideal but we dont want odd curves.
                    // Simplify group edge routes to avoid complex curves
                    if (route.length > 2) {
                        route.splice(1, route.length - 2);
                    }
                    return lineFunction(route);
                }


                // Find all parallel edges between the same two nodes (bidirectional)
                // Get all non-alignment edges between the two nodes, regardless of direction
                const allEdgesBetweenSourceAndTarget = edges.filter(edge => {
                    return !isAlignmentEdge(edge) && (
                                (edge.source.id == d.source.id && edge.target.id == d.target.id) ||
                                (edge.source.id == d.target.id && edge.target.id == d.source.id)
                            );
                });


                // Ensure we have at least 3 points for proper curve control
                // If there are only two points in the route, get the midpoint of the route and add it to the route
                if (route.length === 2) {
                    const midpoint = {
                        x: (route[0].x + route[1].x) / 2,
                        y: (route[0].y + route[1].y) / 2
                    };
                    route.splice(1, 0, midpoint);
                }

                // Calculate edge direction and distance for offset calculations
                // Determine the direction of the edge
                var dx = route[1].x - route[0].x;
                var dy = route[1].y - route[0].y;
                var angle = Math.atan2(dy, dx);
                var distance = Math.sqrt(dx * dx + dy * dy);



                // PARALLEL EDGE SEPARATION: Offset multiple edges to prevent overlap
                /** Here, we do some point of incidence adjustment IF the number of edges between the same nodes is greater than 1 */
                if (allEdgesBetweenSourceAndTarget.length > 1) {
                    const minDistance = 10; // Minimum distance between edges (divided by 2)
                    const edgeIndex = allEdgesBetweenSourceAndTarget.findIndex(edge => edge.id === d.id);

                    // Calculate alternating offsets: positive/negative with increasing magnitude
                    // Start with a small offset and grow it based on the edge index. But start with min offset of 5
                    const offset = (edgeIndex % 2 === 0 ? 1 : -1) * (Math.floor(edgeIndex / 2) + 1) * minDistance;

                    // Apply perpendicular offset based on edge direction
                    // Now we should apply the offset to the start and end points of the route, depending on the angle.

                    if (route.length > 1) {
                        const startIndex = 0;
                        const endIndex = route.length - 1;

                        /*
                        
                        Angle 0: The edge is horizontal and points to the right.
                        Angle π/2 (90 degrees): The edge is vertical and points upwards.
                        Angle π (180 degrees): The edge is horizontal and points to the left.
                        Angle -π/2 (-90 degrees): The edge is vertical and points downwards.
                        */
                        function getDominantDirection(angle) {
                            // Normalize angle between -π and π
                            angle = ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;

                            if (angle >= -Math.PI / 4 && angle <= Math.PI / 4) {
                                return 'right'; // Dominant direction is right
                            } else if (angle > Math.PI / 4 && angle < 3 * Math.PI / 4) {
                                return 'up'; // Dominant direction is up
                            } else if (angle >= 3 * Math.PI / 4 || angle <= -3 * Math.PI / 4) {
                                return 'left'; // Dominant direction is left
                            } else if (angle > -3 * Math.PI / 4 && angle < -Math.PI / 4) {
                                return 'down'; // Dominant direction is down
                            }
                            return null; // Default to null if something unexpected happens
                        }
                        let direction = getDominantDirection(angle);


                        // Apply offset perpendicular to the edge direction
                        // As a result, offset along the y axis.
                        if (direction === 'right' || direction === 'left') {
                            // For horizontal edges, offset vertically
                            route[startIndex].y += offset;
                            route[endIndex].y += offset;
                        }
                        // else if direction is up or down, offset along the x axis
                        else if (direction === 'up' || direction === 'down') {
                            // For vertical edges, offset horizontally
                            route[startIndex].x += offset;
                            route[endIndex].x += offset;
                        }

                        // Ignore the other directions, if they do crop up.

                        // Ensure connection points remain on node perimeters after offset
                        // And ensure it stays on the rectangle perimeter
                        console.log("Adjusting points to rectangle perimeter");
                        route[startIndex] = adjustPointToRectanglePerimeter(route[startIndex], d.source.innerBounds);
                        route[endIndex] = adjustPointToRectanglePerimeter(route[endIndex], d.target.innerBounds);
                    }

                }


                // Apply visual curvature to separate multiple edges
                // Calculate the curvature for the current edge
                var curvature = calculateCurvature(edges, d.source.id, d.target.id, d.id);

                // Apply curvature to the control points (but this does not help with the direction)
                route.forEach(function (point, index) {

                    // Only modify control points, not start/end points
                    if (index > 0 && index < route.length - 1 && curvature !== 0) {
                        // Adjust the control points based on the direction
                        var offsetX = curvature * Math.abs(Math.sin(angle)) * distance;
                        var offsetY = curvature * Math.abs(Math.cos(angle)) * distance;

                        point.x += offsetX;
                        point.y += offsetY;
                    }
                });

                // Convert route points to SVG path string using D3's line function
                return lineFunction(route);
            });

            // LABEL OVERLAP DETECTION: Check if two label bounding boxes intersect
            // Function to check for overlap
            function isOverlapping(label1, label2) {
                const bbox1 = label1.getBBox();
                const bbox2 = label2.getBBox();
                return !(bbox2.x > bbox1.x + bbox1.width ||
                    bbox2.x + bbox2.width < bbox1.x ||
                    bbox2.y > bbox1.y + bbox1.height ||
                    bbox2.y + bbox2.height < bbox1.y);
            }

            // LABEL POSITIONING: Place labels at edge midpoints and resolve overlaps
            // Update label positions after routing edges
            linkGroups.select("text.linklabel")
                .attr("x", function (d) {
                    // Find the corresponding path element and calculate its midpoint
                    const pathElement = document.querySelector(`path[data-link-id="${d.id}"]`);
                    const pathLength = pathElement.getTotalLength();
                    const midpoint = pathElement.getPointAtLength(pathLength / 2);
                    return midpoint.x;
                })
                .attr("y", function (d) {
                    // Find the corresponding path element and calculate its midpoint
                    const pathElement = document.querySelector(`path[data-link-id="${d.id}"]`);
                    const pathLength = pathElement.getTotalLength();
                    const midpoint = pathElement.getPointAtLength(pathLength / 2);
                    return midpoint.y;
                })
                .attr("text-anchor", "end")
                // Check each label for overlaps and adjust positioning
                .each(function (d, i, nodes) {
                    const currentLabel = this;
                    const overlapsWith = [];

                    // Find all labels that overlap with the current one
                    d3.selectAll("text.linklabel").each(function () {
                        if (this !== currentLabel && isOverlapping(currentLabel, this)) {
                            overlapsWith.push(this);
                        }
                    });

                    // Apply overlap minimization if conflicts exist
                    if (overlapsWith.length > 0) {
                        minimizeOverlap(currentLabel, overlapsWith);
                    }
                })
                .raise();

            /**** This bit ensures we zoom to fit ***/
            const bbox = svg.node().getBBox();
            const padding = 10; // Padding in pixels

            const viewBox = [
                bbox.x - padding,
                bbox.y - padding,
                bbox.width + 2 * padding,
                bbox.height + 2 * padding
            ].join(' ');


            const topSvg = d3.select("#svg");
            topSvg.attr('viewBox', viewBox);
            /*************************************/

            function highlightRelation(relName) {
                d3.selectAll(".link")
                    .filter(link => link.relName === relName)
                    .classed("highlighted", true);

                d3.selectAll(".inferredLink")
                    .filter(link => link.relName === relName)
                    .classed("highlighted", true);
            }

            // Get a set of all relNames
            const relNames = new Set(
                edges
                    .filter(edge => !isAlignmentEdge(edge))
                    .map(edge => edge.relName)
            );
            // For each relName, add a LI element to the ul with id "relationList", with the relName as text and hover event to highlight the relation,
            // also a mouseout event to remove the highlight

            // TODO: Maybe these should be checkboxes instead of just text?
            // I wory about the removal of the highlight on uncheck
            const relationList = d3.select("#relationList");
            relationList.selectAll("li")
                .data(Array.from(relNames))
                .enter()
                .append("li")
                .attr("class", "list-group-item")
                .text(d => d)
                .on("mouseover", function (d) {
                    highlightRelation(d);
                    // Also make the text bold
                    d3.select(this).style("font-weight", "bold");
                })
                .on("mouseout", function (event, d) {
                    d3.selectAll(".link")
                        .classed("highlighted", false);
                    d3.selectAll(".inferredLink")
                        .classed("highlighted", false);
                    // Also make the text normal
                    d3.select(this).style("font-weight", "normal");
                });
        }
        finally {

            // PERFORMANCE TRACKING: Record timing data for optimization
            // Only record timing data for the first edge route
            if (edgeRouteIdx === 1) {
                // Stop measuring client-side execution time
                const clientEndTime = performance.now();
                const clientTime = clientEndTime - clientStartTime;
                fetch('/timing', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        clientTime: clientTime
                    })
                });
            }
        }
    };

    /*
        LINK RENDERING
    */

    const linkGroups = svg.selectAll(".link-group");
        // .data(edges)
        // .enter()
        // .append("g")
        // .attr("class", "link-group");

    const link = linkGroups.append("path")
        .attr("class", d => {
            if (isAlignmentEdge(d)) return "alignmentLink";
            if (isInferredEdge(d)) return "inferredLink";
            return "link";
        }) // Dynamically assign class
        .attr("data-link-id", d => d.id);

    linkGroups
        .filter(d => !isAlignmentEdge(d))
        .append("text")
        .attr("class", "linklabel")
        .text(d => d.label);


    function isHiddenNode(node) {
        return node.name.startsWith("_");
    }

    function isAlignmentEdge(edge) {
        return edge.id.startsWith("_alignment_");
    }



    var node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("g") // Create a group for each node
        .attr("class", "node")
        .call(colaLayout.drag);

    node.append("rect")
        .attr("width", function (d) { return d.width; })
        .attr("height", function (d) { return d.height; }) // Use node's height
        .attr("x", function (d) { return -d.width / 2; }) // Center the rectangle on the node's x
        .attr("y", function (d) { return -d.height / 2; }) // Center the rectangle on the node's y
        .attr("stroke", function (d) { return d.color; }) // Outline color of the node
        .attr("rx", 3) // Set the x-axis radius for rounded corners
        .attr("ry", 3) // Set the y-axis radius for rounded corners
        .attr("stroke-width", 1.5) // Adjust the stroke width as needed
        .attr("fill", function (d) {
            let f = isHiddenNode(d) || (d.icon != null) ? "transparent" : "white";
            return f;
        });

    const SMALL_IMG_SCALE_FACTOR = 0.3;

    // Add icon images to nodes if available
    node.filter(d => d.icon) // Filter nodes that have an icon
        .append("image")
        .attr("xlink:href", d => d.icon)
        .attr("width", function (d) {
            if (d.showLabels) {
                return d.width * SMALL_IMG_SCALE_FACTOR;
            }
            return d.width;
        }) // Scale down the icon to fit inside the rectangle
        .attr("height", function (d) {
            if (d.showLabels) {
                return d.height * SMALL_IMG_SCALE_FACTOR;
            }
            return d.height;
        }) // Scale down the icon to fit inside the rectangle
        .attr("x", function (d) {
            if (d.showLabels) {
                // Move to the top-right corner
                return d.x + d.width - (d.width * SMALL_IMG_SCALE_FACTOR);
            }
            // Center the icon horizontally
            return d.x - d.width / 2;
        })
        .attr("y", function (d) {
            if (d.showLabels) {
                // Align with the top edge
                return d.y - d.height / 2;
            }
            // Center the icon vertically
            return d.y - d.height / 2;
        })
        .append("title")
        .text(function (d) { return d.name; })
        .on("error", function (d) {
            d3.select(this).attr("xlink:href", "img/default.png"); // Replace with a default icon
            console.error(`Failed to load icon for node ${d.id}: ${d.icon}`);
        });

    // Add most specific type label
    var mostSpecificTypeLabel = node.append("text")
        .attr("class", "mostSpecificTypeLabel")
        .style("fill", function (d) { return d.color; }) // Set the font color to d.color
        .text(function (d) { return d.mostSpecificType; });

    // Add main label (name and attributes)
    var label =
        //svg.selectAll(".label")
        //.data(nodes)
        node.append("text")
            //.enter().append("text")
            .attr("class", "label")
            .each(function (d) {

                if (isHiddenNode(d)) {
                    return;
                }


                let shouldShowLabels = d.showLabels;
                let displayLabel = shouldShowLabels ? d.name : "";


                // Append tspan for d.name
                d3.select(this).append("tspan")
                    .attr("x", 0) // Align with the parent text element
                    .attr("dy", "0em") // Start at the same vertical position
                    .style("font-weight", "bold")
                    .text(displayLabel);

                if (shouldShowLabels) {
                    var y = 1; // Start from the next line for attributes

                    // Append tspans for each attribute
                    for (let key in d.attributes) {
                        d3.select(this).append("tspan")
                            .attr("x", 0) // Align with the parent text element
                            .attr("dy", `${y}em`) // Move each attribute to a new line
                            .text(key + ": " + d.attributes[key]);
                        y += 1; // Increment for the next line
                    }
                }
            })
            .call(colaLayout.drag);


    // Helper function to calculate new position along the path
    function calculateNewPosition(previousPosition, pathElement, axis) {
        const pathLength = pathElement.getTotalLength();
        const midpointLength = pathLength / 2;
        const offset = 0; //getRandomOffsetAlongPath(); // commenting out to remove jitter

        let targetLength = midpointLength + offset;

        if (targetLength >= pathLength) {
            targetLength = midpointLength;
        }

        const point = pathElement.getPointAtLength(targetLength);
        return axis === 'x' ? point.x : point.y;
    }

    node.append("title")
        .text(function (d) { return d.name; });

    
    /*
        GROUP RENDERING 
    */

    // Add a rectangle for each group and a label at the top of the group
    const DISCONNECTED_NODE_GROUP = "_d_";

    var group = svg.selectAll(".group")
        .data(groups)
        .enter().append("rect")
        .attr("class", function (d) {
            return d.name.startsWith(DISCONNECTED_NODE_GROUP) ? "disconnectedNode" : "group";
        })
        .attr("rx", 8).attr("ry", 8)
        .style("fill", function (d, i) {

            // If d.name starts with "_d_", color it transparent
            if (d.name.startsWith(DISCONNECTED_NODE_GROUP)) {
                return "transparent";
            }


            var targetNode = nodes[d.keyNode];
            return targetNode.color;
        })
        .attr("fill-opacity", 0.25)
        .call(colaLayout.drag);

    // TODO: Uncomment to reenable group labels
    var groupLabel = svg.selectAll(".groupLabel")
        .data(groups)
        .enter().append("text")
        .attr("class", "groupLabel")
        .text(function (d) {

            let shouldShouldGroupLabel = d.showLabel || false;
            if (shouldShouldGroupLabel) {
                if (d.padding) {
                    d.padding = 20;
                }
                return d.name;
            }
            // TODO: Added this
            return "";
            //
        })
        .call(colaLayout.drag);

    colaLayout.on("tick", function () {
        console.log("tick");

        // UPDATE NODES AND NODE LABELS
        // NOTE: The positioning here is only relative to the node group element.
        // TODO: What if I make this absolute positioning? It should seem more dynamic as I drag??
        node.select("rect")
            .each(function (d) { d.innerBounds = d.bounds.inflate(-1); })
            .attr("x", function (d) { return d.bounds.x; })
            .attr("y", function (d) { return d.bounds.y; })
            .attr("width", function (d) { return d.bounds.width(); })
            .attr("height", function (d) { return d.bounds.height(); });
        

        node.select("image")
            .attr("x", function (d) {
                if (d.showLabels) {
                    // Move to the top-right corner
                    return d.x + (d.width / 2) - (d.width * SMALL_IMG_SCALE_FACTOR);
                } else {
                    // Align with d.bounds.x
                    return d.bounds.x;
                }
            })
            .attr("y", function (d) {
                if (d.showLabels) {
                    // Align with the top edge
                    return d.y - d.height / 2;
                } else {
                    // Align with d.bounds.y
                    return d.bounds.y;
                }
            })

        mostSpecificTypeLabel
            .attr("x", function (d) { return -d.width / 2 + 5; })
            .attr("y", function (d) { return -d.height / 2 + 10; })
            .raise();

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .each(function (d) {
                var y = 0; // Initialize y offset for tspans
                d3.select(this).selectAll("tspan")
                    .attr("x", d.x) // Align tspans with the node's x position
                    .attr("dy", function () {
                        y += 1; // Increment y for each tspan to create line spacing
                        return y === 1 ? "0em" : "1em"; // Keep the first tspan in place, move others down
                    });
            })
            .raise();


        // linkGroups.select("path.link")
        //     .attr("d", function (d) {

        //         let source = d.source;
        //         let target = d.target;

        //         const sourceIndex = getNodeIndex(source);
        //         const targetIndex = getNodeIndex(target);

        //         let n = d.id;
        //         if (n.startsWith("_g_")) {

        //             // First get the groupOn and addToGroup indices
        //             let { groupOnIndex, addToGroupIndex } = getGroupOnAndAddToGroupIndices(n);
        //             let addSourceToGroup = groupOnIndex >= addToGroupIndex;
        //             let addTargetToGroup = groupOnIndex < addToGroupIndex;


        //             if (addTargetToGroup) {

        //                 let potentialGroups = getContainingGroups(groups, target);
        //                 let targetGroup = potentialGroups.find(group => group.keyNode === sourceIndex);
        //                 if (targetGroup) {
        //                     target = targetGroup;
        //                     target.innerBounds = targetGroup.bounds.inflate(-1 * targetGroup.padding);
        //                 }
        //                 else {
        //                     console.log("Target group not found", potentialGroups, targetIndex);
        //                 }
        //             }
        //             else if (addSourceToGroup) {

        //                 let potentialGroups = getContainingGroups(groups, source);
        //                 let sourceGroup = potentialGroups.find(group => group.keyNode === targetIndex);
        //                 if (sourceGroup) {
        //                     source = sourceGroup;
        //                     source.innerBounds = sourceGroup.bounds.inflate(-1 * sourceGroup.padding);
        //                 }
        //                 else {
        //                     console.log("Source group not found", potentialGroups, sourceIndex);
        //                 }
        //             }
        //             else {
        //                 console.log("This is a group edge (_on tick_), but neither source nor target is a group.", d);
        //             }
        //         }
        //         var route = cola.makeEdgeBetween(source.innerBounds, target.innerBounds, 5);
        //         return lineFunction([route.sourceIntersection, route.arrowStart]);
        //     })
        //     .attr("marker-end", "url(#end-arrow)") // Ensure the marker-end attribute is set
        //     .raise(); // Raise the path to the top

        // linkGroups.select("text.linklabel")
        //     .attr("x", d => {
        //         const pathElement = document.querySelector(`path[data-link-id="${d.id}"]`);
        //         return calculateNewPosition(d.x, pathElement, 'x');
        //     })
        //     .attr("y", d => {
        //         const pathElement = document.querySelector(`path[data-link-id="${d.id}"]`);
        //         return calculateNewPosition(d.y, pathElement, 'y');
        //     })
        //     .raise();

        // linkGroups.select("text.linklabel")
        //     .attr("x", d => {

        //     )

        // UPDATE GROUPS AND GROUP LABELS
        group.attr("x", function (d) { return d.bounds.x; })
            .attr("y", function (d) { return d.bounds.y; })
            .attr("width", function (d) { return d.bounds.width(); })
            .attr("height", function (d) { return d.bounds.height(); })
            .lower();

        // Render group labels
        groupLabel.attr("x", function (d) { return d.bounds.x + d.bounds.width() / 2; }) // Center horizontally
            .attr("y", function (d) { return d.bounds.y + 12; })
            .attr("text-anchor", "middle") // Center the text on its position
            .raise();

        // linkGroups.select("text.linklabel").raise();

        // Can we get all end-arrow markers and raise them?
        // svg.selectAll("marker").raise();
        linkGroups.select("text.linklabel").raise(); // Ensure link labels are raised

    });

    // Start the cola layout with the specified iterations
    colaLayout.start(
        initialUnconstrainedIterations,
        initialUserConstraintIterations,
        initialAllConstraintsIterations,
        gridSnapIterations)
        .on("end", function () {
            gridify(svg, 10, 25, 10);
        });
}