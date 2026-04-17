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
exports.Shape = void 0;
var VisualObject_1 = require("./VisualObject");
var Constants_1 = require("./Constants");
var TextBox_1 = require("./TextBox");
/**
 * Generic class for a large suite of "shape"-like objects.
 * Generally includes anything with an inside and an outside.
 * All shapes come with builtin label.
 */
var Shape = /** @class */ (function (_super) {
    __extends(Shape, _super);
    /**
     * Constructs a generic shape object. This is a top-level class,
     * which should not be used except as super class for other specific
     * shapes.
     * @param coords coordinates of the shape
     * @param color color of shape's interior
     * @param borderWidth width of Shape's border
     * @param borderColor color of border
     * @param label text to display atop the shape
     * @param labelColor color of text
     * @param labelSize size of text
     */
    function Shape(coords, color, borderWidth, borderColor, label, labelColor, labelSize) {
        var _this = _super.call(this, coords) || this;
        _this.color = color !== null && color !== void 0 ? color : Constants_1.DEFAULT_BORDER_COLOR;
        _this.borderWidth = borderWidth !== null && borderWidth !== void 0 ? borderWidth : Constants_1.DEFAULT_STROKE_WIDTH;
        _this.borderColor = borderColor !== null && borderColor !== void 0 ? borderColor : Constants_1.DEFAULT_COLOR;
        _this.label = new TextBox_1.TextBox(label !== null && label !== void 0 ? label : '', _this.center(), labelColor !== null && labelColor !== void 0 ? labelColor : Constants_1.DEFAULT_TEXT_COLOR, labelSize !== null && labelSize !== void 0 ? labelSize : Constants_1.DEFAULT_FONT_SIZE);
        return _this;
    }
    Shape.prototype.setCenter = function (center) {
        this.label.setCenter(center);
        _super.prototype.setCenter.call(this, center);
    };
    Shape.prototype.render = function (svg) {
        _super.prototype.render.call(this, svg);
        this.label.render(svg);
    };
    Shape.prototype.setColor = function (color) {
        this.color = color;
    };
    Shape.prototype.setBorderWidth = function (borderWidth) {
        this.borderWidth = borderWidth;
    };
    Shape.prototype.setBorderColor = function (borderColor) {
        this.borderColor = borderColor;
    };
    Shape.prototype.setLabelText = function (text) {
        this.label.setText(text);
    };
    Shape.prototype.setLabelColor = function (labelColor) {
        this.label.setTextColor(labelColor);
    };
    Shape.prototype.setLabelSize = function (labelSize) {
        this.label.setFontSize(labelSize);
    };
    return Shape;
}(VisualObject_1.VisualObject));
exports.Shape = Shape;
