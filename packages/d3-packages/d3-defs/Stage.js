"use strict";
exports.__esModule = true;
exports.Stage = void 0;
var d3 = require("d3");
var Stage = /** @class */ (function () {
    function Stage() {
        this.Children = [];
    }
    Stage.prototype.add = function (addObject) {
        this.Children.push(addObject);
    };
    Stage.prototype.render = function (svg, document) {
        d3.selectAll("svg > *").remove();
        this.Children.forEach(function (pane) { return pane.render(svg); });
        if (document) {
            var svgContainer = document.getElementById('svg-container');
            svgContainer.getElementsByTagName('svg')[0].style.height = '200%';
            svgContainer.getElementsByTagName('svg')[0].style.width = '200%';
        }
    };
    return Stage;
}());
exports.Stage = Stage;
