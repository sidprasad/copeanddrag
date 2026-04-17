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
exports.TextBox = void 0;
var d3 = require("d3");
var Constants_1 = require("./Constants");
var VisualObject_1 = require("./VisualObject");
var TextBox = /** @class */ (function (_super) {
    __extends(TextBox, _super);
    /**
     * Displays given text.
     * @param text text to display
     * @param coords location for center of text
     * @param color text color
     * @param fontSize size of the text
     */
    function TextBox(text, coords, color, fontSize) {
        var _this = _super.call(this, coords) || this;
        _this.text = text !== null && text !== void 0 ? text : "";
        _this.fontSize = fontSize !== null && fontSize !== void 0 ? fontSize : Constants_1.DEFAULT_FONT_SIZE;
        _this.color = color !== null && color !== void 0 ? color : Constants_1.DEFAULT_TEXT_COLOR;
        return _this;
    }
    TextBox.prototype.boundingBox = function () {
        return {
            top_left: {
                x: this.coords.x - (this.fontSize / 2),
                y: this.coords.y - (this.fontSize / 2)
            },
            bottom_right: {
                x: this.coords.x + (this.fontSize / 2),
                y: this.coords.y + (this.fontSize / 2)
            }
        };
    };
    TextBox.prototype.setText = function (text) { this.text = text; };
    TextBox.prototype.setFontSize = function (fontSize) { this.fontSize = fontSize; };
    TextBox.prototype.setTextColor = function (color) { this.color = color; };
    TextBox.prototype.render = function (svg) {
        d3.select(svg)
            .append('text')
            .attr('x', this.coords.x)
            .attr('y', this.coords.y)
            .attr('text-anchor', 'middle')
            .attr("alignment-baseline", "central")
            .attr('font-size', this.fontSize)
            .attr('fill', this.color)
            .text(this.text);
        _super.prototype.render.call(this, svg);
    };
    return TextBox;
}(VisualObject_1.VisualObject));
exports.TextBox = TextBox;
