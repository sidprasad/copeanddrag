"use strict";
exports.__esModule = true;
exports.scriptViewImports = exports.d3LibDefs = void 0;
var Rectangle_1 = require("./Rectangle");
var Circle_1 = require("./Circle");
var Shape_1 = require("./Shape");
var Stage_1 = require("./Stage");
var TextBox_1 = require("./TextBox");
var VisualObject_1 = require("./VisualObject");
var Line_1 = require("./Line");
var Grid_1 = require("./Grid");
var ConjoinedObject_1 = require("./ConjoinedObject");
var Polygon_1 = require("./Polygon");
var Graph_1 = require("./Graph");
var Tree_1 = require("./Tree");
var Edge_1 = require("./Edge");
exports.d3LibDefs = "\n";
/**
 * The order here will be \textbf{very} important. Make sure files come after
 * the files they import.
 */
var scriptViewImports = [
    { name: "VisualObject", value: VisualObject_1.VisualObject },
    { name: "Shape", value: Shape_1.Shape },
    { name: "Grid", value: Grid_1.Grid },
    { name: "Rectangle", value: Rectangle_1.Rectangle },
    { name: "Circle", value: Circle_1.Circle },
    { name: "Stage", value: Stage_1.Stage },
    { name: "TextBox", value: TextBox_1.TextBox },
    { name: "Line", value: Line_1.Line },
    { name: "ConjoinedObject", value: ConjoinedObject_1.ConjoinedObject },
    { name: "Polygon", value: Polygon_1.Polygon },
    { name: "Graph", value: Graph_1.Graph },
    { name: "Tree", value: Tree_1.Tree },
    { name: "Edge", value: Edge_1.Edge }
];
exports.scriptViewImports = scriptViewImports;
