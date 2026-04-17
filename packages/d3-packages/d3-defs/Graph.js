"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.Graph = void 0;
var VisualObject_1 = require("./VisualObject");
var Constants_1 = require("./Constants");
var Line_1 = require("./Line");
var Circle_1 = require("./Circle");
var TextBox_1 = require("./TextBox");
var ConjoinedObject_1 = require("./ConjoinedObject");
var Graph = /** @class */ (function (_super) {
    __extends(Graph, _super);
    //note that for the simplicity of our algorithm, node_to_location refers to the coordinates of the node WHERE (0,0) IS THE
    //TOP LEFT OF OUR GRAPH GRAPHIC SQUARE. Offset is handled in the rendering of the objects
    function Graph(coords, graph_dimensions, fixed_nodes, node_radius) {
        var _this = 
        /**
         *
         * @param coords: the location of the square containing the entire graph visual
         * @param graph_dimensions: the height/width of the graph visual square (for simplicity graph is always
         * visualized in a square)
         * @param fixed_nodes: the number of nodes we want graphically distributed on the edges of our graphic (if
         * you don't care about this it should just be 4)
         * @param node_radius: the graphical size of each node
         */
        _super.call(this, coords) || this;
        _this.nodes = [];
        _this.graph_dimensions = graph_dimensions !== null && graph_dimensions !== void 0 ? graph_dimensions : Constants_1.SCREEN_WIDTH;
        _this.node_radius = node_radius !== null && node_radius !== void 0 ? node_radius : Constants_1.DEFAULT_NODE_RADIUS;
        _this.fixed_nodes = fixed_nodes !== null && fixed_nodes !== void 0 ? fixed_nodes : Constants_1.DEFAULT_GRAPH_FIXED_NODES;
        _this.node_to_location = {};
        return _this;
    }
    Graph.prototype.setCenter = function (center) {
        /**
         * As the graph is just represented as a square, this is a copy of the method setCenter for the rectangle
         */
        this.coords = {
            x: center.x - this.graph_dimensions / 2,
            y: center.y - this.graph_dimensions / 2
        };
    };
    Graph.prototype.center = function () {
        return {
            x: this.coords.x + this.graph_dimensions / 2,
            y: this.coords.y + this.graph_dimensions / 2
        };
    };
    Graph.prototype.add = function (Nodes) {
        var _this = this;
        /**
         * The algorithm for setting the locations of our graph nodes works as follows:
         *
         * Fix the location of n nodes around the corners of the image (we choose the n nodes with the most
         * connections to minimize the graphical damage of this)
         *
         * Compute the "new" locations of each of our remaining nodes -> for each node, its new location is the
         * average location of its neighbors. After each new location is computed, we move these new nodes to their
         * respective locations.
         *
         * The above step is then repeated k times (for some k > 1000), and by the magic of graph theory our
         * graph won't look terrible
         */
        this.nodes = this.nodes.concat(Nodes);
        this.check_add_set(this.nodes);
        this.nodes.sort(function (a, b) {
            if (a.neighbors.length > b.neighbors.length) {
                return 1;
            }
            else if (b.neighbors.length > a.neighbors.length) {
                return -1;
            }
            else {
                return 0;
            }
        });
        var fixed_nodes = this.nodes.slice(0, this.fixed_nodes);
        this.set_fixed_nodes(fixed_nodes);
        var malleable_nodes = this.nodes.slice(this.fixed_nodes); //the nodes we are are going to be changing the locations of
        malleable_nodes.forEach(function (node) {
            _this.node_to_location[node.name] = { x: _this.graph_dimensions / 2, y: _this.graph_dimensions / 2 };
        });
        for (var ignored = 0; ignored < 10000; ignored++) {
            this.set_malleable_nodes(malleable_nodes);
        }
    };
    Graph.prototype.set_fixed_nodes = function (Nodes) {
        var _this = this;
        /**
         * We distribute the location of our fixed nodes evenly across the circle of our specified radius
         */
        var n = Nodes.length;
        var r = this.graph_dimensions / 2; //radius
        var i = 0;
        Nodes.forEach(function (node) {
            i++;
            _this.node_to_location[node.name] = {
                x: _this.graph_dimensions / 2 + r * Math.cos(i * (2 * Math.PI) / n),
                y: _this.graph_dimensions / 2 + r * Math.sin(i * (2 * Math.PI) / n)
            };
        });
    };
    Graph.prototype.set_malleable_nodes = function (malleable_nodes) {
        var _this = this;
        /**
         * One iteration of our algorithm to align the points
         *
         * Given a set of non-fixed nodes (see add method for description of this algo), set each nodes
         * location to the avg location of its neighbors
         */
        var newLocations = {};
        malleable_nodes.forEach(function (node) {
            var neighbor_locations = node.neighbors.map(function (neighbor) {
                return { x: _this.node_to_location[neighbor].x, y: _this.node_to_location[neighbor].y };
            });
            var sum_neighbor_x = 0; //compute avg location of neighbors
            var sum_neighbor_y = 0;
            neighbor_locations.forEach(function (location) {
                sum_neighbor_x += location.x;
                sum_neighbor_y += location.y;
            });
            newLocations[node.name] = {
                x: sum_neighbor_x / neighbor_locations.length,
                y: sum_neighbor_y / neighbor_locations.length
            };
        });
        malleable_nodes.forEach(function (element) {
            _this.node_to_location[element.name] = newLocations[element.name];
        });
    };
    Graph.prototype.check_add_set = function (Nodes) {
        /**
         * Given a set of nodes, we verify that these nodes satisfy the following conditions:
         *
         * 1. No node is named twice (i.e. we can't have two nodes named 'i')
         * 2. Each neighbor of the node is a valid node (i.e. if we have node i such that
         * i.neighbors = ['j','k','m'], then we also have nodes 'j','k','m' in our set)
         *
         *
         * As an aside, we want this method to be private, except that it's used in the Tree class
         */
        var node_names = new Set([]);
        Nodes.forEach(function (node) {
            if (node_names.has(node.name)) {
                var error = "Repeat node. Found duplicate of node ".concat(node.name);
                throw error;
            }
            node_names.add(node.name);
        });
        Nodes.forEach(function (node) {
            node.neighbors.forEach(function (neighbor) {
                if (!node_names.has(neighbor)) {
                    var error = "Neighbor not found. Was unable to find node ".concat(neighbor, " in set of nodes");
                    throw error;
                }
            });
        });
    };
    Graph.prototype.render = function (svg) {
        var unparseableConnections = new Set(); //find all UNIQUE connections (if A -> B and B -> A we don't want
        //two different lines)
        this.nodes.forEach(function (node) {
            node.neighbors.forEach(function (neighbor) {
                var connection = node.name + "," + neighbor;
                if (!unparseableConnections.has(neighbor + "," + node.name)) {
                    unparseableConnections.add(connection);
                }
            });
        });
        var connections = [];
        unparseableConnections.forEach(function (connection) {
            connections.push(connection.split(","));
        });
        this.render_lines(svg, connections);
        this.render_nodes(svg);
    };
    Graph.prototype.render_lines = function (svg, connections) {
        var _this = this;
        /**
         * Render each of the connections (our connections are given by the set of all unique
         * paths, which we compute in the render phase)
         */
        connections.forEach(function (connection) {
            var points = [
                { x: _this.node_to_location[connection[0]].x + _this.coords.x,
                    y: _this.node_to_location[connection[0]].y + _this.coords.y },
                { x: _this.node_to_location[connection[1]].x + _this.coords.x,
                    y: _this.node_to_location[connection[1]].y + _this.coords.y },
            ];
            var connectionLine = new Line_1.Line(points);
            connectionLine.render(svg);
        });
    };
    Graph.prototype.render_nodes = function (svg) {
        var _this = this;
        /**
         * Iterate over each of our nodes, rendering each as a circle using the node_to_location dict
         */
        this.nodes.forEach(function (node) {
            var nodeCircle = new Circle_1.Circle(_this.node_radius, {
                x: 0,
                y: 0
            }, "red");
            var circleLabel = new TextBox_1.TextBox(node.name, { x: 0, y: 0 }, "black", _this.node_radius / 2);
            var conj = new ConjoinedObject_1.ConjoinedObject([nodeCircle, circleLabel]);
            conj.setCenter({ x: _this.node_to_location[node.name].x + _this.coords.x, y: _this.node_to_location[node.name].y + _this.coords.y });
            conj.render(svg);
        });
    };
    return Graph;
}(VisualObject_1.VisualObject));
exports.Graph = Graph;
