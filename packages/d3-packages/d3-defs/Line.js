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
exports.boundsOfList = exports.shiftList = exports.averagePath = exports.Line = void 0;
var d3 = require('d3');
var VisualObject_1 = require("./VisualObject");
var Constants_1 = require("./Constants");
var Line = /** @class */ (function (_super) {
    __extends(Line, _super);
    /**
     * Creates a line on the given poitns.
     * @param points list of points for the line to pass through
     * @param color color of line
     * @param width width of line
     */
    function Line(points, color, width) {
        var _this = _super.call(this, points[0]) || this;
        _this.points = points;
        _this.color = color !== null && color !== void 0 ? color : Constants_1.DEFAULT_LINE_COLOR;
        _this.width = width !== null && width !== void 0 ? width : Constants_1.DEFAULT_STROKE_WIDTH;
        return _this;
    }
    Line.prototype.boundingBox = function () {
        return boundsOfList(this.points);
    };
    Line.prototype.setColor = function (color) {
        this.color = color;
    };
    Line.prototype.setWidth = function (width) {
        this.width = width;
    };
    // Using averagePath utility to return rough center
    Line.prototype.center = function () {
        return averagePath(this.points);
    };
    // Shifts points so average is at new center
    Line.prototype.setCenter = function (center) {
        var shift = {
            x: center.x - this.center().x,
            y: center.y - this.center().y
        };
        this.points = shiftList(this.points, shift);
    };
    Line.prototype.render = function (svg) {
        var path = d3.path();
        path.moveTo(this.points[0].x, this.points[0].y);
        this.points.forEach(function (point) {
            path.lineTo(point.x, point.y);
        });
        d3.select(svg)
            .append('path')
            .attr('d', path)
            .attr('stroke-width', this.width)
            .attr('stroke', this.color)
            .attr('fill', 'transparent'); // Should prob make easier in future.
        _super.prototype.render.call(this, svg);
    };
    return Line;
}(VisualObject_1.VisualObject));
exports.Line = Line;
/**
 * Simple method averaging the coordinate points in a series.
 * @param points
 * @returns
 */
function averagePath(points) {
    if (points == undefined) {
        return { x: 0, y: 0 };
    }
    if (points.length == 0) {
        return { x: 0, y: 0 };
    }
    //Averages the points
    return points.reduce(function (previousValue, currentValue) {
        return {
            x: previousValue.x + currentValue.x / points.length,
            y: previousValue.y + currentValue.y / points.length
        };
    }, { x: 0, y: 0 });
}
exports.averagePath = averagePath;
/**
 * Shifts a list of points according to a shift variable
 * @param pointList
 * @param shift
 * @returns
 */
function shiftList(pointList, shift) {
    var newPoints = pointList.map(function (point) {
        return {
            x: point.x + shift.x,
            y: point.y + shift.y
        };
    });
    return newPoints;
}
exports.shiftList = shiftList;
/**
 * Utility function returning bounding box for a list of points
 * @param pointList list of points as coords
 * @returns bounding box
 */
function boundsOfList(pointList) {
    var x_min = Infinity;
    var y_min = Infinity;
    var x_max = -Infinity;
    var y_max = -Infinity;
    pointList.forEach(function (point) {
        x_min = Math.min(x_min, point.x);
        x_max = Math.max(x_max, point.x);
        y_min = Math.min(y_min, point.y);
        y_max = Math.max(y_max, point.y);
    });
    return {
        top_left: { x: x_min, y: y_min },
        bottom_right: { x: x_max, y: y_max }
    };
}
exports.boundsOfList = boundsOfList;
