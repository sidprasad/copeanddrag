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
exports.ConjoinedObject = void 0;
var VisualObject_1 = require("./VisualObject");
var ConjoinedObject = /** @class */ (function (_super) {
    __extends(ConjoinedObject, _super);
    function ConjoinedObject(Children) {
        var _this = _super.call(this, { x: 0, y: 0 }) || this;
        _this.objects = [];
        if (Children) {
            Children.forEach(function (child) {
                _this.add(child);
            });
        }
        return _this;
    }
    ConjoinedObject.prototype.addOrdered = function (obj, index) {
        /**
         * Given an arbitrary visual object, inserts that object at the given
         * index. If the index is greater than the length of objects +1 an error is thrown
         */
        if (index > this.objects.length) {
            throw "Index larger than current number of objects stored plus 1. Add an index between 0 and ".concat(this.objects.length);
        }
        this.objects.splice(index, 0, obj);
    };
    ConjoinedObject.prototype.add = function (obj) {
        /**
         * Ease of access feature by which the visual object that we want to add is added to the front of the visualization
         */
        this.addOrdered(obj, 0);
    };
    ConjoinedObject.prototype.setCenter = function (coords) {
        /**
         * Align all the objects in the conjoined object to a single center
         */
        this.objects.forEach(function (obj) {
            obj.setCenter(coords);
        });
    };
    ConjoinedObject.prototype.render = function (svg) {
        /**
         * We render each of our objects. Note that this is done in inverse order of the list,
         * as the first element in the list should be the frontmost element
         */
        for (var i = this.objects.length - 1; i >= 0; i--) {
            this.objects[i].render(svg);
        }
    };
    return ConjoinedObject;
}(VisualObject_1.VisualObject));
exports.ConjoinedObject = ConjoinedObject;
