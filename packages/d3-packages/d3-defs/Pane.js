"use strict";
exports.__esModule = true;
exports.Pane = void 0;
var Pane = /** @class */ (function () {
    /*
      Note that we can have many types of panes that ultimately inherit from Pane.
      But for starters in the project let's just get one pane that works
      */
    function Pane() {
        this.Children = [];
    }
    Pane.prototype.add = function (addNode) {
        this.Children.push(addNode);
    };
    Pane.prototype.render = function (svg) {
        this.Children.forEach(function (child) { return child.render(svg); });
    };
    return Pane;
}());
exports.Pane = Pane;
