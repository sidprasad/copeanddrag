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
exports.Rectangle = void 0;
var Shape_1 = require("./Shape");
var d3 = require("d3");
var Rectangle = /** @class */ (function (_super) {
    __extends(Rectangle, _super);
    /**
     * Creates a logical rectangle object
     * @param height height (y direction)
     * @param width width (x direction)
     * @param coords coordinates of the top-left point
     * @param color color for interior
     * @param borderWidth width of border
     * @param borderColor color of border
     * @param label text for label
     * @param labelColor color for label text
     * @param labelSize size of label text
     */
    function Rectangle(height, width, coords, color, borderWidth, borderColor, label, labelColor, labelSize) {
        var _this = _super.call(this, coords, color, borderWidth, borderColor, label, labelColor, labelSize) || this;
        _this.height = height;
        _this.width = width;
        _this.label.setCenter(_this.center()); //TODO: FIX THIS
        return _this;
    }
    Rectangle.prototype.boundingBox = function () {
        return {
            top_left: { x: this.coords.x, y: this.coords.y },
            bottom_right: { x: this.coords.x + this.width, y: this.coords.y + this.height }
        };
    };
    Rectangle.prototype.setWidth = function (width) { this.width = width; };
    Rectangle.prototype.setHeight = function (height) { this.height = height; };
    Rectangle.prototype.center = function () {
        var _a, _b;
        return { x: this.coords.x + ((_a = this.width) !== null && _a !== void 0 ? _a : 0) / 2, y: this.coords.y + ((_b = this.height) !== null && _b !== void 0 ? _b : 0) / 2 }; //shitfix
    };
    Rectangle.prototype.setCenter = function (center) {
        this.coords = {
            x: center.x - this.width / 2,
            y: center.y - this.height / 2
        };
        this.label.setCenter(center);
    };
    Rectangle.prototype.render = function (svg) {
        d3.select(svg)
            .append('rect')
            .attr('x', this.coords.x)
            .attr('y', this.coords.y)
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('stroke-width', this.borderWidth)
            .attr('stroke', this.borderColor)
            .attr('fill', this.color);
        _super.prototype.render.call(this, svg);
    };
    return Rectangle;
}(Shape_1.Shape));
exports.Rectangle = Rectangle;
