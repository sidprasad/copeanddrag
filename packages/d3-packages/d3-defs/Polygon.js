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
exports.Polygon = void 0;
var Shape_1 = require("./Shape");
var d3 = require("d3");
var Line_1 = require("./Line");
/**
 * Class Representing Polygonal objects. Takes the form of any
 * series of points, and will form a polygon with said points as the boundary.
 */
var Polygon = /** @class */ (function (_super) {
    __extends(Polygon, _super);
    /**
     * Constructs a polygon object
     * @param points list of points forming outside
     * @param color color of interior
     * @param borderWidth width of the border
     * @param borderColor color of the border
     * @param label text to label with
     * @param labelColor color of label text
     * @param labelSize size of the label
     */
    function Polygon(points, color, borderWidth, borderColor, label, labelColor, labelSize) {
        var _this = _super.call(this, points[0], color, borderWidth, borderColor, label, labelColor, labelSize) || this;
        _this.points = points;
        _this.label.setCenter(_this.center());
        return _this;
    }
    Polygon.prototype.boundingBox = function () {
        return (0, Line_1.boundsOfList)(this.points);
    };
    // Using averagePath utility to return rough center
    Polygon.prototype.center = function () { return (0, Line_1.averagePath)(this.points); };
    // Shifts points so average is at new center
    Polygon.prototype.setCenter = function (center) {
        var shift = {
            x: -this.center().x + center.x,
            y: -this.center().y + center.y
        };
        this.points = (0, Line_1.shiftList)(this.points, shift);
        _super.prototype.setCenter.call(this, center);
    };
    Polygon.prototype.render = function (svg) {
        var path = d3.path();
        path.moveTo(this.points[0].x, this.points[0].y);
        this.points.forEach(function (point) {
            path.lineTo(point.x, point.y);
        });
        path.closePath();
        d3.select(svg)
            .append('path')
            .attr('d', path)
            .attr('stroke-width', this.borderWidth)
            .attr('stroke', this.borderColor)
            .attr('fill', this.color);
        _super.prototype.render.call(this, svg);
    };
    return Polygon;
}(Shape_1.Shape));
exports.Polygon = Polygon;
