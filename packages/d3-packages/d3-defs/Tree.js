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
exports.Tree = void 0;
var VisualObject_1 = require("./VisualObject");
var Line_1 = require("./Line");
var Constants_1 = require("./Constants");
var Tree = /** @class */ (function (_super) {
    __extends(Tree, _super);
    /**
     * Builds a tree object, pulling all children nodes into proper locations and
     * adding lines where necessary.
     * @param root root of the tree of visual objects
     * @param height height of box to bound the tree
     * @param width width of box to bound the tree
     * @param coords top left point of the tree
     */
    function Tree(root, height, width, coords, edgeColor, edgeWidth) {
        var _this = _super.call(this, coords) || this;
        _this.height = height;
        _this.width = width;
        _this.root = root;
        _this.root.visualObject.setCenter({
            x: _this.coords.x + _this.width / 2,
            y: _this.coords.y
        });
        console.log(_this);
        _this.setUpSubtrees();
        _this.setLineColor(edgeColor !== null && edgeColor !== void 0 ? edgeColor : Constants_1.DEFAULT_TREE_LINE_COLOR);
        _this.setLineWidth(edgeWidth !== null && edgeWidth !== void 0 ? edgeWidth : Constants_1.DEFAULT_TREE_LINE_WIDTH);
        return _this;
    }
    Tree.prototype.setUpSubtrees = function () {
        var _this = this;
        var layerHeight = this.height / (treeHeight(this.root) - 1);
        console.log(layerHeight);
        var totalWidth = this.root.children
            .map(function (childTree) { return treeWidth(childTree); })
            .reduce(function (partialSum, childWidth) { return partialSum + childWidth; }, 0);
        this.subTrees = [];
        var currTotalWidth = 0;
        this.subTrees = this.root.children.map(function (childTree) {
            var childWidth = treeWidth(childTree);
            var prevWidth = currTotalWidth;
            currTotalWidth += childWidth;
            return new Tree(childTree, layerHeight * (treeHeight(childTree) - 1), _this.width * treeWidth(childTree) / totalWidth, {
                x: _this.coords.x + (prevWidth / totalWidth) * _this.width,
                y: _this.coords.y + layerHeight
            });
        });
        this.lines = [];
        this.subTrees.forEach(function (subTree) {
            _this.lines.push(new Line_1.Line([{
                    x: _this.root.visualObject.center().x,
                    y: _this.root.visualObject.center().y
                },
                {
                    x: subTree.root.visualObject.center().x,
                    y: subTree.root.visualObject.center().y
                }], "black", 2 // Need to make default later
            ));
        });
    };
    Tree.prototype.setCenter = function (center) {
        this.coords = {
            x: center.x - this.width / 2,
            y: center.y - this.height / 2
        };
        this.root.visualObject.setCenter({
            x: this.coords.x + this.width / 2,
            y: this.coords.y
        });
        this.setUpSubtrees();
    };
    Tree.prototype.setLineColor = function (color) {
        this.lines.forEach(function (line) { return line.setColor(color); });
        this.subTrees.forEach(function (subTree) { return subTree.setLineColor(color); });
    };
    Tree.prototype.setLineWidth = function (width) {
        this.lines.forEach(function (line) { return line.setWidth(width); });
        this.subTrees.forEach(function (subTree) { return subTree.setLineWidth(width); });
    };
    Tree.prototype.renderNodes = function (svg) {
        this.root.visualObject.render(svg);
        this.subTrees.forEach(function (subTree) { return subTree.renderNodes(svg); });
    }; // Need to separate line rendering and node rendering because lines need to be done after. 
    Tree.prototype.renderLines = function (svg) {
        this.lines.forEach(function (line) { return line.render(svg); });
        this.subTrees.forEach(function (subTree) { return subTree.renderLines(svg); });
    };
    Tree.prototype.render = function (svg) {
        this.renderLines(svg);
        this.renderNodes(svg);
    };
    return Tree;
}(VisualObject_1.VisualObject));
exports.Tree = Tree;
/**
 * Utility func finding length of a tree
 * @param visTree
 * @returns the height of the tree (depth)
 */
function treeHeight(visTree) {
    var height = 0;
    var toCheck = [visTree];
    var _loop_1 = function () {
        height += 1;
        var newToCheck = [];
        toCheck.forEach(function (visTree) {
            visTree.children.forEach(function (child) {
                newToCheck.push(child);
            });
        });
        toCheck = newToCheck;
    };
    while (toCheck.length != 0) {
        _loop_1();
    }
    return height;
}
/**
 * Utility function finding width of a tree
 * @param visTree
 * @returns the width of the tree (depth)
 */
function treeWidth(visTree) {
    var width = 1;
    var toCheck = [visTree];
    var _loop_2 = function () {
        var newToCheck = [];
        toCheck.forEach(function (visTree) {
            visTree.children.forEach(function (child) {
                newToCheck.push(child);
            });
        });
        toCheck = newToCheck;
        width = Math.max(width, newToCheck.length);
    };
    while (toCheck.length != 0) {
        _loop_2();
    }
    return width;
}
