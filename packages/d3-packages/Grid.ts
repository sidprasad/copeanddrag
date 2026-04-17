import {VisualObject} from './VisualObject'
import { Coords, BoundingBox, toFunc } from './Utility'
import {Line} from './Line'
import {Rectangle} from './Rectangle'


interface gridProps{
    grid_location: Coords | (() => Coords), //note: coords refers to the top left portion of the grid
    cell_size:{
        x_size:number, // Maybe make these functions too? to consider.
        y_size:number
    },
    grid_dimensions:{
        x_size:number,
        y_size:number
    },
}

export class Grid extends VisualObject{
    /**
     * 
     * As one of the most common expressions of a graph is a matrix, we offer functionality
     * for building a grid of cells, where you can add visual objects to each square in the grid,
     * and they are automatically formatted into the grid (where the center of the object is aligned
     * to the center of the grid)
     * 
     *  Note: grid size is fixed! You can't change the size of a grid once it's created
     * 
     */
    private coords: () => Coords // For easier math
    config: gridProps
    private cells: Array<Array<VisualObject>>
    gridlines: Array<Line>

    constructor(props: gridProps){ // renamed to props for consistency
        super(props.grid_location)
        this.config = props
        // Note: We should never be accessing the grid_location field of config after this
        // point. It is

        let coordsFunc = toFunc({x: 0, y:0}, this.config.grid_location)
        this.center = () => {
            const cs = coordsFunc()
            return {
                x: cs.x + (this.config.grid_dimensions.x_size * this.config.cell_size.x_size / 2),
                y: cs.y + (this.config.grid_dimensions.y_size * this.config.cell_size.y_size / 2)
            }
        }
        // Coords is essentially a helper function because it's easier to deal with. It needs
        // to be defined in terms of the center for use within the system, however, as that's
        // What's going to be edited to move the grid. 
        this.coords = () => {
            const ctr = this.center()
            return {
                x: ctr.x - (this.config.grid_dimensions.x_size * this.config.cell_size.x_size / 2),
                y: ctr.y - (this.config.grid_dimensions.y_size * this.config.cell_size.y_size / 2)
            }
        }
        
        // Cells is indexed by rows first, which are y-coordinates
        this.cells = new Array(this.config.grid_dimensions.y_size).fill([])
        for(var row = 0; row<this.cells.length;row++) { 
            this.cells[row] = new Array(this.config.grid_dimensions.x_size) 
        }
        this.gridlines = []
        this.fill_grid_lines()
    }

    // Note: shouldn't need to override boundingbox, as will just be union of children objects

    private check_bounding_box(proposed_bounding_box:BoundingBox){
        /**
         * A check to verify that, when adding an object to a grid cell, that object will fit inside
         * the grid cell (the bounding box of that grid is smaller than the size of the cell).
         * 
         * Note: calling grid.add({x:...,y:...},...,true) will hide this error
         */
        const bounding_box_width = proposed_bounding_box.bottom_right.x - proposed_bounding_box.top_left.x
        const bounding_box_height = proposed_bounding_box.bottom_right.y - proposed_bounding_box.top_left.y

        if(bounding_box_height > this.config.cell_size.y_size){
            const error = `Proposed object to add is taller than grid cells. Add "true" as the last parameter to
            grid.add() to hide this error.
            Grid cells are ${this.config.cell_size.y_size}
            units tall, while the object you want to add is ${bounding_box_height} units tall`
            throw error
        }
        if(bounding_box_width > this.config.cell_size.x_size){
            const error = `Proposed object to add is wider than grid cells. Add "true" as the last parameter to
            grid.add() to hide this error.
            Grid cells are ${this.config.cell_size.x_size}
            units tall, while the object you want to add is ${bounding_box_width} units tall`
            throw error
        }
    }

    /**
     * Add a child object, positioned in the appropriate row/column of this grid. 
     * 
     * @param coords the row and column indexes to place this object in
     * @param add_object the object to add as a child of this grid
     * @param ignore_warning set true to ignore insufficient-space warnings
     */
    add(coords: Coords, add_object:VisualObject, ignore_warning?:boolean){
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
        
        // Runtime check, since the input script isn't necessarily type-checked
        if(!(add_object instanceof VisualObject)) {
            throw new Error('Grid can only add VisualObjects as children.')
        }

        this.check_coords(coords)

        if(!ignore_warning){this.check_bounding_box(add_object.boundingBox())}
        this.children.push(add_object) 
        add_object.center = this.center_helper(coords, add_object.origin_offset) 
        // Cells are indexed by rows first, which are y-coordinates
        this.cells[coords.y][coords.x] = add_object // provide easy indexing for children
    }

    private center_helper(coords: Coords, offset: () => Coords): (() => Coords) {        
        return () => { 
            let off: Coords = offset()  
            const thiscs = this.coords()
            return {            
            x: thiscs.x + this.config.cell_size.x_size * (coords.x + .5) + off.x,
            y: thiscs.y + this.config.cell_size.y_size * (coords.y + .5) + off.y
        }}
    }

    // TODO: Figure out what to do for this in functional case. 
    // remove(coords: Coords){
    //     /**
    //      * Given valid coordinates of our grid, we remove the object in a given cell
    //      * 
    //      * If no such object exists, we don't do anything
    //      */

    //         this.check_coords(coords)
        
    //         const target_cell: gridCell = this.cells[coords.x][coords.y]
    //         if(!target_cell.contents){
    //             delete target_cell['contents']
    //         }
    // }
    
    private fill_grid_lines(){
    /**
     * We offer the option to have our grid have line boundaries be filled in. 
     * 
     * Calling this method adds these lines to be rendered (calling more than once does nothing)
     */
        //cols
        for(let y_coord = 0; y_coord <= this.config.grid_dimensions.y_size; y_coord++){
            let newLine: (() => Coords)[] = [() => { 
                const thiscs = this.coords()
                return {
                    x: thiscs.x,
                    y: thiscs.y + y_coord * this.config.cell_size.y_size
            }}, () => { 
                const thiscs = this.coords()
                return {
                    x: thiscs.x + this.config.grid_dimensions.x_size*this.config.cell_size.x_size,
                    y: thiscs.y + y_coord * this.config.cell_size.y_size
            }}]
            const horizLine: Line = new Line({points: newLine});
            this.gridlines.push(horizLine)
            this.children.push(horizLine)
        }

        //rows
        for(let x_coord = 0; x_coord <= this.config.grid_dimensions.x_size; x_coord++){
            let newLine: (() => Coords)[] = [() => {
                const thiscs = this.coords()
                return {
                    x: thiscs.x + x_coord*this.config.cell_size.x_size,
                    y: thiscs.y
            }}, () => { 
                const thiscs = this.coords()
                return {
                    x: thiscs.x + x_coord*this.config.cell_size.x_size,
                    y: thiscs.y + this.config.grid_dimensions.y_size*this.config.cell_size.y_size
            }}]
            
            const vertLine: Line = new Line({points: newLine});
            this.gridlines.push(vertLine)
            this.children.push(vertLine)    
        }
    }

    hide_grid_lines(){ // A bit easier to keep the lines around logically - maybe make
        // this a boolean in the constructor in future?
        this.gridlines.forEach((line: Line) => {line.setOpacity(0)})
    }

    fill(coords: Coords, color: string){
        /**
         * Given a single coordinate square of our grid, we fill that
         * square in with a given color
         */
        
        this.check_coords(coords)

        const addRectangle:Rectangle = new Rectangle({
            height: this.config.cell_size.x_size, //y_size
            width: this.config.cell_size.y_size
        }) //x_size
        
        addRectangle.setColor(color)

        this.add(coords, addRectangle)
    }

    private check_coords(coords:Coords){
        /**
         * (This function ensures validity of inputted coords)
         * 
         * Given a set of coords passed into a function involving the grid coordinates, we verify that
         * these coordinates are positive integers within the bounds of the coordinate size
         */
        if(!Number.isInteger(coords.x) || !Number.isInteger(coords.y)){
            throw `non-integer indices given for grid coords. Inputted coords: ${coords.x},${coords.y}`;
        }
        if(coords.x < 0 || coords.y < 0){
            throw "negative indices given for grid coords";
        }
        if(coords.x > (this.config.grid_dimensions.x_size-1) || coords.y > (this.config.grid_dimensions.y_size-1)){
            throw `coordinates out of bounds. Grid is of x_size ${this.config.grid_dimensions.x_size} and y_size ${this.config.grid_dimensions.y_size}\n
            Note: passing in 2 refers to index 2 which is the third element of the grid`
        }
    }

    /**
     * Convenience accessor to get child at a given row,col index, if one exists
     * @param x row index
     * @param y column index
     * @returns child at that index if one exists, undefined otherwise 
     */
    childAt(x: number, y: number): VisualObject | undefined {
        if(this.cells[x] === undefined) return undefined
        if(this.cells[x][y] === undefined) return undefined
        return this.cells[x][y]
    }
}
