/** COnstants */
const initialUnconstrainedIterations = 10; //unconstrained initial layout iterations
const initialUserConstraintIterations = 100; // initial layout iterations with user-specified constraints
const initialAllConstraintsIterations = 1000; // initial layout iterations with all constraints including non-overlap
const gridSnapIterations = 5; // iterations of "grid snap", which pulls nodes towards grid cell centers - grid of size node[0].width - only really makes sense if all nodes have the same width and heigh
const margin = 10;
const dy_for_linespacing = 5; // Adjust for spacing between lines
//////////


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

// Function to generate a random offset along the path
function getRandomOffsetAlongPath() {
    return (Math.random() - 0.5) * 20; // Random value between -10 and 10
}


function calculateOverlapArea(bbox1, bbox2) {
    const x_overlap = Math.max(0, Math.min(bbox1.x + bbox1.width, bbox2.x + bbox2.width) - Math.max(bbox1.x, bbox2.x));
    const y_overlap = Math.max(0, Math.min(bbox1.y + bbox1.height, bbox2.y + bbox2.height) - Math.max(bbox1.y, bbox2.y));
    return x_overlap * y_overlap;
}

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

// Goes through the groups and finds ALL groups that contain the node

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



function setupLayout(d3, nodes, edges, constraints, groups, width, height) {


    let edgeRouteIdx = 0;

    // Start measuring client-side execution time
    const clientStartTime = performance.now();



    // Create a zoom behavior
    var zoom = d3.zoom()
        .scaleExtent([0.5, 5]) // Set the zoom scale limits
        .on("zoom", zoomed);

    function zoomed() {
        d3.select(".zoomable").attr("transform", d3.event.transform);
    }

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

    const min_sep = 50;
    const default_node_width = 100;

    ///// Check whats up TODO ////
    let scaleFactorInput = document.getElementById("scaleFactor");
    let scaleFactor = scaleFactorInput ? parseFloat(scaleFactorInput.value) : 1;

    if (scaleFactorInput) {
        scaleFactorInput.addEventListener("change", function () {
            scaleFactor = parseFloat(scaleFactorInput.value) / 5;

            let linkLength = (min_sep + default_node_width) / scaleFactor;
            console.log("Link length", linkLength);

            colaLayout.linkDistance(linkLength);
            colaLayout.start(
                initialUnconstrainedIterations,
                initialUserConstraintIterations,
                initialAllConstraintsIterations,
                gridSnapIterations)
                .on("end", routeEdges);
        });
    }

    // TODO: Figure out WHEN to use flowLayout and when not to use it.
    // I think having directly above/ below makes it impossible to have flow layout 'y' *unless we have heirarchy*

    colaLayout
        .nodes(nodes)
        .links(edges)
        .constraints(constraints)
        .groups(groups)
        .groupCompactness(1e-3)
        .symmetricDiffLinkLengths(min_sep + default_node_width);


    var lineFunction = d3.line()
        .x(function (d) { return d.x; })
        .y(function (d) { return d.y; })
        .curve(d3.curveBasis);

    var routeEdges = function () {

        try {
            colaLayout.prepareEdgeRouting(margin / 3);
            console.log("Routing edges for the nth time", ++edgeRouteIdx);

            // What I want to do is change the angle based on the number of edges between the same nodes
            // Function to calculate curvature based on number of edges and index
            function calculateCurvature(edges, fromNode, toNode, edgeid) {
                const sourceIndex = getNodeIndex(fromNode);
                const targetIndex = getNodeIndex(toNode);

                // Get all edges between the two nodes, regardless of direction
                const allEdges = edges.filter(edge => {
                    return (edge.source.id == fromNode && edge.target.id == toNode) ||
                        (edge.source.id == toNode && edge.target.id == fromNode);
                });

                const edgeCount = allEdges.length;
                let index = allEdges.findIndex(edge => edge.id == edgeid);

                // Calculate curvature
                let curvature = 0;
                if (edgeCount > 1) {
                    curvature = (index % 2 === 0 ? 1 : -1) * (Math.floor(index / 2) + 1) * 0.15 * edgeCount;
                }
                return curvature;
            }


            link.attr("d", function (d, i) {
                let n = d.id;

                try {
                    var route = colaLayout.routeEdge(d);

                    // Handle self-loop (source and target are the same)
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
                    console.log("Error routing edge", d.id, `from ${d.source.id} to ${d.target.id}`);
                    console.error(e);

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
                    return lineFunction([{ x: d.source.x, y: d.source.y }, { x: d.target.x, y: d.target.y }]);
                }

                // This is a special case for group edges
                if (n.startsWith("_g_")) {
                    let source = d.source;
                    let target = d.target;

                    let sourceIndex = getNodeIndex(source.id);
                    let targetIndex = getNodeIndex(target.id);

                    // Get the groupOn and addToGroup indices
                    let { groupOnIndex, addToGroupIndex } = getGroupOnAndAddToGroupIndices(n);


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

                    // The target of the edge is the relevant group member.
                    let addTargetToGroup = groupOnIndex < addToGroupIndex;
                    // The source of the edge is the relevant group member.
                    let addSourceToGroup = groupOnIndex >= addToGroupIndex;

                    if (addTargetToGroup) {

                        let potentialGroups = getContainingGroups(groups, target);
                        let targetGroup = potentialGroups.find(group => group.keyNode === sourceIndex);
                        if (targetGroup) {
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

                        let potentialGroups = getContainingGroups(groups, source);
                        let sourceGroup = potentialGroups.find(group => group.keyNode === targetIndex);
                        if (sourceGroup) {
                            let newSourceCoords = closestPointOnRect(sourceGroup.bounds.inflate(-1), route[route.length - 1]);
                            let currentSource = route[0];
                            currentSource.x = newSourceCoords.x;
                            currentSource.y = newSourceCoords.y;
                            route[0] = currentSource;
                        }
                        else {
                            console.log("Source group not found", potentialGroups, sourceIndex, targetIndex, n );
                        }

                    }
                    else {
                        console.log("This is a group edge, but neither source nor target is a group.", d);
                    }

                    // Not ideal but we dont want odd curves.
                    if (route.length > 2) {
                        route.splice(1, route.length - 2);
                    }
                    return lineFunction(route);
                }


                // Get all edges between the two nodes, regardless of direction
                const allEdgesBetweenSourceAndTarget = edges.filter(edge => {
                    return (edge.source.id == d.source.id && edge.target.id == d.target.id) ||
                        (edge.source.id == d.target.id && edge.target.id == d.source.id);
                });


                // If there are only two points in the route, get the midpoint of the route and add it to the route
                if (route.length === 2) {
                    const midpoint = {
                        x: (route[0].x + route[route.length - 1].x) / 2 + 50,
                        y: (route[0].y + route[route.length - 1].y) / 2 - 50
                    };
                    route.splice(1, 0, midpoint); // Insert the midpoint
                }

                return lineFunction(route);
            });

            // Function to check for overlap
            function isOverlapping(label1, label2) {
                const bbox1 = label1.getBBox();
                const bbox2 = label2.getBBox();
                return !(bbox2.x > bbox1.x + bbox1.width ||
                    bbox2.x + bbox2.width < bbox1.x ||
                    bbox2.y > bbox1.y + bbox1.height ||
                    bbox2.y + bbox2.height < bbox1.y);
            }


            // Update label positions after routing edges
            linkGroups.select("text.linklabel")
                .attr("x", function (d) {
                    const pathElement = document.querySelector(`path[data-link-id="${d.id}"]`);
                    const pathLength = pathElement.getTotalLength();
                    const midpoint = pathElement.getPointAtLength(pathLength / 2);
                    return midpoint.x;
                })
                .attr("y", function (d) {
                    const pathElement = document.querySelector(`path[data-link-id="${d.id}"]`);
                    const pathLength = pathElement.getTotalLength();
                    const midpoint = pathElement.getPointAtLength(pathLength / 2);
                    return midpoint.y;
                })
                .attr("text-anchor", "end")
                .each(function (d, i, nodes) {
                    const currentLabel = this;
                    const overlapsWith = [];

                    d3.selectAll("text.linklabel").each(function () {
                        if (this !== currentLabel && isOverlapping(currentLabel, this)) {
                            overlapsWith.push(this);
                        }
                    });

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
            }

            // Get a set of all relNames
            const relNames = new Set(edges.map(edge => edge.relName));
            // For each relName, add a LI element to the ul with id "relationList", with the relName as text and hover event to highlight the relation,
            // also a mouseout event to remove the highlight


            // Maybe these should be checkboxes instead of just text?
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
                    // Also make the text normal
                    d3.select(this).style("font-weight", "normal");
                });
        }
        finally {


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


    const linkGroups = svg.selectAll(".link-group")
        .data(edges)
        .enter()
        .append("g")
        .attr("class", "link-group");

    const link = linkGroups.append("path")
        .attr("class", "link")
        .attr("data-link-id", d => d.id);

    linkGroups.append("text")
        .attr("class", "linklabel")
        .text(d => d.label);


    function isHiddenNode(node) {
        return node.name.startsWith("_");
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
                if(d.padding) {
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

        group.attr("x", function (d) {
            return d.bounds.x;
        })
            .attr("y", function (d) {
                return d.bounds.y;
            })

            .attr("width", function (d) { return d.bounds.width(); })
            .attr("height", function (d) { return d.bounds.height(); })
            .lower();


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
                return d.x + (d.width/2) - (d.width * SMALL_IMG_SCALE_FACTOR);
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
            .attr("x", function (d) { return d.x - d.width / 2 + 5; })
            .attr("y", function (d) { return d.y - (d.height / 2) + 10; })
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


        linkGroups.select("path.link")
            .attr("d", function (d) {

                let source = d.source;
                let target = d.target;

                const sourceIndex = getNodeIndex(source);
                const targetIndex = getNodeIndex(target);

                let n = d.id;
                if (n.startsWith("_g_")) {

                    // First get the groupOn and addToGroup indices
                    let { groupOnIndex, addToGroupIndex } = getGroupOnAndAddToGroupIndices(n);
                    let addSourceToGroup = groupOnIndex >= addToGroupIndex;
                    let addTargetToGroup = groupOnIndex < addToGroupIndex;


                    if (addTargetToGroup) {

                        let potentialGroups = getContainingGroups(groups, target);
                        let targetGroup = potentialGroups.find(group => group.keyNode === sourceIndex);
                        if (targetGroup) {
                            target = targetGroup;
                            target.innerBounds = targetGroup.bounds.inflate(-1 * targetGroup.padding);
                        }
                        else {
                            console.log("Target group not found", potentialGroups, targetIndex);
                        }
                    }
                    else if (addSourceToGroup) {

                        let potentialGroups = getContainingGroups(groups, source);
                        let sourceGroup = potentialGroups.find(group => group.keyNode === targetIndex);
                        if (sourceGroup) {
                            source = sourceGroup;
                            source.innerBounds = sourceGroup.bounds.inflate(-1 * sourceGroup.padding);
                        }
                        else {
                            console.log("Source group not found", potentialGroups, sourceIndex);
                        }
                    }
                    else {
                        console.log("This is a group edge (_on tick_), but neither source nor target is a group.", d);
                    }
                }
                var route = cola.makeEdgeBetween(source.innerBounds, target.innerBounds, 5);
                return lineFunction([route.sourceIntersection, route.arrowStart]);
            })
            .attr("marker-end", "url(#end-arrow)") // Ensure the marker-end attribute is set
            .raise(); // Raise the path to the top

        linkGroups.select("text.linklabel")
            .attr("x", d => {
                const pathElement = document.querySelector(`path[data-link-id="${d.id}"]`);
                return calculateNewPosition(d.x, pathElement, 'x');
            })
            .attr("y", d => {
                const pathElement = document.querySelector(`path[data-link-id="${d.id}"]`);
                return calculateNewPosition(d.y, pathElement, 'y');
            })
            .raise();




        groupLabel.attr("x", function (d) {
            return d.bounds.x + d.bounds.width() / 2;

        }) // Center horizontally
            .attr("y", function (d) { return d.bounds.y + 12; })
            .attr("text-anchor", "middle") // Center the text on its position
            .lower();


        linkGroups.select("text.linklabel").raise();

        // Can we get all end-arrow markers and raise them?
        svg.selectAll("marker").raise();
        linkGroups.select("text.linklabel").raise(); // Ensure link labels are raised

    });

    colaLayout.start(
        initialUnconstrainedIterations,
        initialUserConstraintIterations,
        initialAllConstraintsIterations,
        gridSnapIterations)
        .on("end", routeEdges);
}