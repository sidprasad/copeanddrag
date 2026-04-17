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
exports.Edge = void 0;
var Line_1 = require("./Line");
var VisualObject_1 = require("./VisualObject");
var Edge = /** @class */ (function (_super) {
    __extends(Edge, _super);
    //the simplest design of this is as a pointer between two objects
    function Edge(params) {
        var _this = _super.call(this) || this;
        _this.obj1 = params.obj1;
        _this.obj2 = params.obj2;
        _this.text = params.text;
        _this.compute_points(360);
        return _this;
    }
    Edge.prototype.compute_points = function (precision) {
        var target_point = this.mid_point(
        //we set a point to optimize distance from
        this.obj1.center(), this.obj2.center());
        this.obj1Coords = this.opt_points(target_point, this.obj1, precision);
        this.obj2Coords = this.opt_points(target_point, this.obj2, precision);
    };
    Edge.prototype.opt_points = function (target_point, obj, precision) {
        var boundary_points = [];
        for (var i = 1; i <= precision; i++) {
            var boundary_point = obj
                .getExperimentalBoundingBox()
                .lambda((2 * Math.PI) / i);
            boundary_points.push(boundary_point);
        }
        return this.get_minimum_distance(target_point, boundary_points);
    };
    Edge.prototype.get_minimum_distance = function (target_point, compare_points) {
        var _this = this;
        var curr_min_point = compare_points[0];
        if (compare_points.length == 0) {
            throw "Error: no points to compare. Talk to Sidney about this one I'd say. Problem in Edge.ts";
        }
        compare_points.forEach(function (p) {
            if (_this.distance(p, target_point) <
                _this.distance(curr_min_point, target_point)) {
                curr_min_point = p;
            }
        });
        return curr_min_point;
    };
    Edge.prototype.distance = function (p1, p2 //a helper in the compute_points method in which we compute the distance between two points
    ) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    };
    Edge.prototype.mid_point = function (p1, p2) {
        //given a line, finds the midpoint of that line
        return {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2
        };
    };
    Edge.prototype.render = function (svg) {
        var makeLine = new Line_1.Line([this.obj1Coords, this.obj2Coords]);
        makeLine.render(svg);
    };
    return Edge;
}(VisualObject_1.VisualObject));
exports.Edge = Edge;
