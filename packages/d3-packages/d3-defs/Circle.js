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
exports.Circle = void 0;
var Shape_1 = require("./Shape");
var d3 = require('d3');
var Circle = /** @class */ (function (_super) {
    __extends(Circle, _super);
    /**
     * Creates a circle object at the given location
     * @param radius radius of circle
     * @param coords coordinates of circle's center
     * @param color color of interior
     * @param borderWidth width border
     * @param borderColor color for border
     * @param label text for label
     * @param labelColor color of label
     * @param labelSize size of label
     */
    function Circle(radius, coords, color, borderWidth, borderColor, label, labelColor, labelSize) {
        var _this = _super.call(this, coords, color, borderWidth, borderColor, label, labelColor, labelSize) || this;
        _this.radius = radius;
        return _this;
    }
    Circle.prototype.boundingBox = function () {
        return {
            top_left: {
                x: this.coords.x - this.radius,
                y: this.coords.y - this.radius
            },
            bottom_right: {
                x: this.coords.x + this.radius,
                y: this.coords.y + this.radius
            }
        };
    };
    Circle.prototype.setRadius = function (radius) {
        this.radius = radius;
    };
    Circle.prototype.getExperimentalBoundingBox = function () {
        var _this = this;
        return {
            lambda: function (radians) {
                return {
                    x: _this.radius * Math.cos(radians) + _this.coords.x,
                    y: _this.radius * Math.sin(radians) + _this.coords.x
                };
            }
        };
    };
    Circle.prototype.render = function (svg) {
        d3.select(svg)
            .append('circle')
            .attr('cx', this.coords.x)
            .attr('cy', this.coords.y)
            .attr('r', this.radius)
            .attr('stroke-width', this.borderWidth)
            .attr('stroke', this.borderColor)
            .attr('fill', this.color);
        _super.prototype.render.call(this, svg);
    };
    return Circle;
}(Shape_1.Shape));
exports.Circle = Circle;
