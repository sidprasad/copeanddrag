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
exports.Grid = void 0;
var VisualObject_1 = require("./VisualObject");
var Line_1 = require("./Line");
var Rectangle_1 = require("./Rectangle");
var Grid = /** @class */ (function (_super) {
    __extends(Grid, _super);
    function Grid(config) {
        var _this = _super.call(this, config.grid_location) || this;
        _this.config = config;
        _this.cells = [];
        _this.gridlines = [];
        _this.initialize_cells();
        _this.fill_grid_lines();
        return _this;
    }
    Grid.prototype.boundingBox = function () {
        return {
            top_left: this.coords,
            bottom_right: {
                x: this.coords.x + this.config.cell_size.x_size * this.config.grid_dimensions.x_size,
                y: this.coords.y + this.config.cell_size.y_size * this.config.grid_dimensions.y_size
            }
        };
    };
    Grid.prototype.initialize_cells = function () {
        /**
         *
         * Fill in the cells of the grid with blank objects (note: this is where we
         * do the computations as to where the centers of objects are)
         *
         */
        for (var x_coord = 0; x_coord < this.config.grid_dimensions.x_size; x_coord++) {
            this.cells.push([]);
            for (var y_coord = 0; y_coord < this.config.grid_dimensions.y_size; y_coord++) {
                var empty_cell = {
                    center: {
                        x: this.config.grid_location.x + this.config.cell_size.x_size * x_coord +
                            +this.config.cell_size.x_size / 2,
                        y: this.config.grid_location.y + this.config.cell_size.y_size * y_coord +
                            +this.config.cell_size.y_size / 2
                    }
                };
                this.cells[x_coord].push(empty_cell);
            }
        }
    };
    Grid.prototype.center = function () {
        return {
            x: this.coords.x + this.config.grid_dimensions.x_size * this.config.cell_size.x_size / 2,
            y: this.coords.y + this.config.grid_dimensions.y_size * this.config.cell_size.y_size / 2
        };
    };
    Grid.prototype.setCenter = function (center) {
        /**
         * Adjust the centering of the table. We first update the "config.grid_location" variable
         * (this tells the table where its upper left corber is)
         *
         * and then iterate through the children elements to the table, snapping each to their new location
         */
        this.config.grid_location = {
            x: center.x - (this.config.grid_dimensions.x_size / 2 * this.config.cell_size.x_size),
            y: center.y - (this.config.grid_dimensions.y_size / 2 * this.config.cell_size.y_size)
        };
        for (var x_coord = 0; x_coord < this.config.grid_dimensions.x_size; x_coord++) {
            for (var y_coord = 0; y_coord < this.config.grid_dimensions.y_size; y_coord++) {
                var new_cell = {
                    center: {
                        x: this.config.grid_location.x + this.config.cell_size.x_size * x_coord +
                            +this.config.cell_size.x_size / 2,
                        y: this.config.grid_location.y + this.config.cell_size.y_size * y_coord +
                            +this.config.cell_size.y_size / 2
                    }
                };
                if (this.cells[x_coord][y_coord].contents) {
                    var cell_concents = this.cells[x_coord][y_coord].contents;
                    new_cell.contents = cell_concents;
                    cell_concents === null || cell_concents === void 0 ? void 0 : cell_concents.setCenter(new_cell.center);
                }
                this.cells[x_coord][y_coord] = new_cell;
            }
        }
        this.gridlines = [];
        this.fill_grid_lines();
    };
    Grid.prototype.check_bounding_box = function (proposed_bounding_box) {
        /**
         * A check to verify that, when adding an object to a grid cell, that object will fit inside
         * the grid cell (the bounding box of that grid is smaller than the size of the cell).
         *
         * Note: calling grid.add({x:...,y:...},...,true) will hide this error
         */
        var bounding_box_width = proposed_bounding_box.bottom_right.x - proposed_bounding_box.top_left.x;
        var bounding_box_height = proposed_bounding_box.bottom_right.y - proposed_bounding_box.top_left.y;
        if (bounding_box_height > this.config.cell_size.y_size) {
            var error = "Proposed object to add is taller than grid cells. Add \"true\" as the last parameter to\n            grid.add() to hide this error.\n            Grid cells are ".concat(this.config.cell_size.y_size, "\n            units tall, while the object you want to add is ").concat(bounding_box_height, " units tall");
            throw error;
        }
        if (bounding_box_width > this.config.cell_size.x_size) {
            var error = "Proposed object to add is wider than grid cells. Add \"true\" as the last parameter to\n            grid.add() to hide this error.\n            Grid cells are ".concat(this.config.cell_size.x_size, "\n            units tall, while the object you want to add is ").concat(bounding_box_width, " units tall");
            throw error;
        }
    };
    Grid.prototype.add = function (coords, add_object, ignore_warning) {
        /**
         * Given valid coordinates of our grid, we add and center an object to a given
         * coordinate (note: we don't support adding multiple VisualObjects to the same frame -
         * they must be conjoined)
         *
         * TODO: add feature that, when we add a new object to a cell in the grid that already has
         * object, we make a new VisualObject that is that object conjoined with the new object
         *
         * (creating a conjoined visual object shouldn't be too tough)
         */
        this.check_coords(coords);
        if (!ignore_warning) {
            this.check_bounding_box(add_object.boundingBox());
        }
        var target_cell = this.cells[coords.x][coords.y];
        target_cell.contents = add_object;
        add_object.setCenter(target_cell.center); //center object
    };
    Grid.prototype.remove = function (coords) {
        /**
         * Given valid coordinates of our grid, we remove the object in a given cell
         *
         * If no such object exists, we don't do anything
         */
        this.check_coords(coords);
        var target_cell = this.cells[coords.x][coords.y];
        if (!target_cell.contents) {
            delete target_cell['contents'];
        }
    };
    Grid.prototype.fill_grid_lines = function () {
        /**
         * We offer the option to have our grid have line boundaries be filled in.
         *
         * Calling this method adds these lines to be rendered (calling more than once does nothing)
         */
        //cols
        for (var y_coord = 0; y_coord <= this.config.grid_dimensions.y_size; y_coord++) {
            var horizLine = new Line_1.Line([
                { y: this.config.grid_location.y + y_coord * this.config.cell_size.y_size,
                    x: this.config.grid_location.x },
                { y: this.config.grid_location.y + y_coord * this.config.cell_size.y_size,
                    x: this.config.grid_location.x + this.config.grid_dimensions.x_size * this.config.cell_size.x_size }
            ]);
            this.gridlines.push(horizLine);
        }
        //rows
        for (var x_coord = 0; x_coord <= this.config.grid_dimensions.x_size; x_coord++) {
            var vertLine = new Line_1.Line([
                { y: this.config.grid_location.y,
                    x: this.config.grid_location.x + x_coord * this.config.cell_size.x_size },
                { y: this.config.grid_location.y + this.config.grid_dimensions.y_size * this.config.cell_size.y_size,
                    x: this.config.grid_location.x + x_coord * this.config.cell_size.x_size }
            ]);
            this.gridlines.push(vertLine);
        }
    };
    Grid.prototype.hide_grid_lines = function () {
        this.gridlines = [];
    };
    Grid.prototype.fill = function (coords, color) {
        /**
         * Given a single coordinate square of our grid, we fill that
         * square in with a given color
         */
        this.check_coords(coords);
        var addRectangle = new Rectangle_1.Rectangle(this.config.cell_size.x_size, //y_size
        this.config.cell_size.y_size); //x_size
        addRectangle.setColor(color);
        this.add(coords, addRectangle);
    };
    Grid.prototype.check_coords = function (coords) {
        /**
         * (This function ensures validity of inputted coords)
         *
         * Given a set of coords passed into a function involving the grid coordinates, we verify that
         * these coordinates are positive integers within the bounds of the coordinate size
         */
        if (!Number.isInteger(coords.x) || !Number.isInteger(coords.y)) {
            throw "non-integer indices given for grid coords. Inputted coords: ".concat(coords.x, ",").concat(coords.y);
        }
        if (coords.x < 0 || coords.y < 0) {
            throw "negative indices given for grid coords";
        }
        if (coords.x > (this.config.grid_dimensions.x_size - 1) || coords.y > (this.config.grid_dimensions.y_size - 1)) {
            throw "coordinates out of bounds. Grid is of x_size ".concat(this.config.grid_dimensions.x_size, " and y_size ").concat(this.config.grid_dimensions.y_size, "\n\n            Note: passing in 2 refers to index 2 which is the third element of the grid");
        }
    };
    Grid.prototype.render = function (svg) {
        //render gridlines
        this.gridlines.forEach(function (elt) { return elt.render(svg); });
        //render each child in each cell
        for (var x_coord = 0; x_coord < this.config.grid_dimensions.x_size; x_coord++) {
            for (var y_coord = 0; y_coord < this.config.grid_dimensions.y_size; y_coord++) {
                var target_cell = this.cells[x_coord][y_coord];
                if (target_cell.contents) {
                    target_cell.contents.render(svg);
                }
            }
        }
    };
    return Grid;
}(VisualObject_1.VisualObject));
exports.Grid = Grid;
