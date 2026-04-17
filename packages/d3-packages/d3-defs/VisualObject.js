"use strict";
/**
 * To anyone adding to this library in the future: please take the following steps when adding
 * new VisualObjects.
 *
 * 1. If the object is to be accessible within sterling, add it to library within ScriptViewImports.
 * 2. Add the name of the file, minus .d.ts, to the list within d3lib-def-compiler/src/D3LibDefCompiler.java.
 *    Make sure to add the name to the end of the list, following any files it imports.
 * 3. Run the typescript compiler ("tsc" in terminal) from within the d3-packages folder.
 * 4. Run the main method within D3LibDefCompiler.
 *
 * If these steps are not followed, the file's definitions will either not be accessible within
 * sterling, or will not show up in monaco.
 */
exports.__esModule = true;
exports.VisualObject = void 0;
var VisualObject = /** @class */ (function () {
    /**
     * Top level class, which all other visual objects will extend.
     * @param coords position of the object on screen.
     */
    function VisualObject(coords) {
        this.coords = coords !== null && coords !== void 0 ? coords : { x: 0, y: 0 };
        this.children = [];
    }
    VisualObject.prototype.boundingBox = function () {
        return { top_left: { x: 0, y: 0 }, bottom_right: { x: 0, y: 0 } };
    };
    VisualObject.prototype.getExperimentalBoundingBox = function () {
        //NOT functional NOT functional NOT functional
        return {
            lambda: function (r) {
                return { x: 0, y: 0 };
            }
        };
    };
    /**
     * Returns the center of the object
     * @returns coordinates of center
     */
    VisualObject.prototype.center = function () {
        return this.coords;
    };
    /**
     * Shifts object to have new given center
     * @param center new center of the object
     */
    VisualObject.prototype.setCenter = function (center) {
        this.coords = center;
        this.children.forEach(function (child) { return child.setCenter(center); });
    };
    /**
     * Renders the object to the screen.
     * @param svg HTML Svg object to which the object should be rendered.
     */
    VisualObject.prototype.render = function (svg) {
        this.children.forEach(function (child) { return child.render(svg); });
    };
    return VisualObject;
}());
exports.VisualObject = VisualObject;
