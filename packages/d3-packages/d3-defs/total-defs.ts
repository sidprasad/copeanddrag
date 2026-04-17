
export const D3_TOTAL_DEFS: string = `
/**
 * To anyone adding to this library in the future: please take the following steps when adding
 * new VisualObjects.
 *
 * 1. If the object is to be accessible within sterling, add it to library within ScriptViewImports.
 * 2. Add the name of the file, minus .d.ts, to the list within d3lib-def-compiler/src/D3LibDefCompiler.java.
 * 3. Run the typescript compiler ("tsc" in terminal) from within the d3-packages folder.
 * 4. Run the main method within D3LibDefCompiler.
 *
 * If these steps are not followed, the file's definitions will either not be accessible within
 * sterling, or will not show up in monaco.
 */
declare type BoundingBoxGenerator = (r: number) => Coords;
declare class VisualObject {
    center: () => Coords;
    children: VisualObject[];
    dependents: VisualObject[];
    bounding_box_lam: BoundingBoxGenerator;
    hasBoundingBox: boolean;
    /**
     * Top level class, which all other visual objects will extend.
     * @param coords position of the object on screen.
     */
    constructor(coords?: Coords | (() => Coords));
    boundingBox(): BoundingBox;
    getChildren(): VisualObject[];
    /**
     * Shifts object to have new given center
     * @param center new center of the object
     */
    setCenter(center: Coords | (() => Coords)): void;
    hasLam(): Boolean;
    getLam(): BoundingBoxGenerator;
    /**
     * Renders the object to the screen.
     * @param svg HTML Svg object to which the object should be rendered.
     */
    render(svg: any): void;
}
//# sourceMappingURL=VisualObject.d.ts.map
interface ShapeProps {
    center?: Coords | (() => Coords);
    color?: string | (() => string);
    borderWidth?: number | (() => number);
    borderColor?: string | (() => string);
    label?: string | (() => string);
    labelColor?: string | (() => string);
    labelSize?: number | (() => number);
    opacity?: number | (() => number);
}
/**
 * Generic class for a large suite of "shape"-like objects.
 * Generally includes anything with an inside and an outside.
 * All shapes come with builtin label.
 */
declare class Shape extends VisualObject {
    color: () => string;
    borderWidth: () => number;
    borderColor: () => string;
    opacity: () => number;
    label: TextBox;
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
     * @param style
     */
    constructor(props: ShapeProps);
    setColor(color: string | (() => string)): void;
    setBorderWidth(borderWidth: number | (() => number)): void;
    setBorderColor(borderColor: string | (() => string)): void;
    setLabelText(text: string | (() => string)): void;
    setLabelColor(labelColor: string | (() => string)): void;
    setLabelSize(labelSize: number | (() => number)): void;
}
//# sourceMappingURL=Shape.d.ts.map
declare class Pane {
    Children: VisualObject[];
    constructor();
    add(addNode: VisualObject): void;
    render(svg: any): void;
}
//# sourceMappingURL=Pane.d.ts.map
interface gridProps {
    grid_location: Coords | (() => Coords);
    cell_size: {
        x_size: number;
        y_size: number;
    };
    grid_dimensions: {
        x_size: number;
        y_size: number;
    };
}
declare class Grid extends VisualObject {
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
    private coords;
    config: gridProps;
    cells: Array<Array<VisualObject>>;
    gridlines: Array<Line>;
    constructor(props: gridProps);
    private check_bounding_box;
    add(coords: Coords, add_object: VisualObject, ignore_warning?: boolean): void;
    private center_helper;
    private fill_grid_lines;
    hide_grid_lines(): void;
    fill(coords: Coords, color: string): void;
    private check_coords;
}
{};
//# sourceMappingURL=Grid.d.ts.map
interface RectangleProps extends ShapeProps {
    height: number | (() => number);
    width: number | (() => number);
    coords?: Coords | (() => Coords);
}
declare class Rectangle extends Shape {
    height: () => number;
    width: () => number;
    /**
     * Creates a logical rectangle object
     * @param height height (y direction)
     * @param width width (x direction)
     * @param coords coordinates of the top-left point
     * @param color color for interior
     * @param borderWidth width of border
     * @param borderColor color of border
     * @param label text for label
     * @param labelColor color for label text
     * @param labelSize size of label text
     */
    constructor(props: RectangleProps);
    boundingBox(): BoundingBox;
    setWidth(width: number | (() => number)): void;
    setHeight(height: number | (() => number)): void;
    render(svg: any): void;
}
//# sourceMappingURL=Rectangle.d.ts.map
interface CircleProps extends ShapeProps {
    radius: number | (() => number);
}
declare class Circle extends Shape {
    radius: () => number;
    bounding_box_lam: BoundingBoxGenerator;
    /**
     * Creates a circle object at the given location
     * @param radius radius of circle
     * @param coords coordinates of circle's center
     * @param color color of interior
     * @param borderWidth width border
     * @param borderColor color for border
     * @param label text for label
     * @param labelColor color of label
     * @param labelSize size of label
     */
    constructor(props: CircleProps);
    boundingBox(): BoundingBox;
    setRadius(radius: number | (() => number)): void;
    render(svg: any): void;
}
//# sourceMappingURL=Circle.d.ts.map
declare class Stage {
    Children: VisualObject[];
    constructor();
    add(addObject: VisualObject): void;
    children_to_tree_recurse(root: VisualObject): VisTree;
    render(svg: any, document?: any): void;
}
//# sourceMappingURL=Stage.d.ts.map
interface TextBoxProps {
    text?: string | (() => string);
    coords?: Coords | (() => Coords);
    color?: string | (() => string);
    fontSize?: number | (() => number);
}
declare class TextBox extends VisualObject {
    text: () => string;
    fontSize: () => number;
    color: () => string;
    /**
     * Displays given text.
     * @param text text to display
     * @param coords location for center of text
     * @param color text color
     * @param fontSize size of the text
     */
    constructor(props: TextBoxProps);
    boundingBox(): BoundingBox;
    setText(text: string | (() => string)): void;
    setFontSize(fontSize: number | (() => number)): void;
    setTextColor(color: string | (() => string)): void;
    render(svg: any): void;
}
//# sourceMappingURL=TextBox.d.ts.map
interface LineProps {
    points?: Coords[] | (() => Coords)[];
    arrow?: boolean;
    color?: string | (() => string);
    width?: number | (() => number);
    opacity?: number | (() => number);
    style?: string | (() => string);
}
declare class Line extends VisualObject {
    pointsRelative: (() => Coords)[];
    color: () => string;
    width: () => number;
    opacity: () => number;
    arrow: boolean;
    style: () => string;
    /**
     * Creates a line on the given poitns.
     * @param points list of points for the line to pass through
     * @param color color of line
     * @param width width of line
     * @param opacity of the line
     */
    constructor(props: LineProps);
    boundingBox(): BoundingBox;
    setColor(color: string | (() => string)): void;
    setWidth(width: number | (() => number)): void;
    setOpacity(opacity: number | (() => number)): void;
    render(svg: any): void;
}
//# sourceMappingURL=Line.d.ts.map
/**
 * This class is not currently being used!!
 */
declare class ConjoinedObject extends VisualObject {
    /**
     * Note: this code is untested!
     */
    children: VisualObject[];
    constructor(Children?: VisualObject[]);
    addOrdered(obj: VisualObject, index: number): void;
    add(obj: VisualObject): void;
    setCenter(coords: Coords): void;
    render(svg: any): void;
}
//# sourceMappingURL=ConjoinedObject.d.ts.map
interface PolygonProps extends ShapeProps {
    points: Coords[] | (() => Coords)[];
}
/**
 * Class Representing Polygonal objects. Takes the form of any
 * series of points, and will form a polygon with said points as the boundary.
 */
declare class Polygon extends Shape {
    pointsRelative: (() => Coords)[];
    /**
     * Constructs a polygon object
     * @param points list of points forming outside
     * @param color color of interior
     * @param borderWidth width of the border
     * @param borderColor color of the border
     * @param label text to label with
     * @param labelColor color of label text
     * @param labelSize size of the label
     */
    constructor(props: PolygonProps);
    boundingBox(): BoundingBox;
    render(svg: any): void;
}
//# sourceMappingURL=Polygon.d.ts.map
interface Node {
    name: string;
    neighbors: string[];
}
declare class Graph extends VisualObject {
    nodes: Node[];
    node_radius: number;
    fixed_nodes: number;
    graph_dimensions: number;
    node_to_location: any;
    constructor(coords?: Coords, graph_dimensions?: number, fixed_nodes?: number, node_radius?: number);
    setCenter(center: Coords): void;
    center(): {
        x: any;
        y: any;
    };
    add(Nodes: Node[]): void;
    private set_fixed_nodes;
    private set_malleable_nodes;
    check_add_set(Nodes: Node[]): void;
    render(svg: any): void;
    render_lines(svg: any, connections: string[][]): void;
    render_nodes(svg: any): void;
}
//# sourceMappingURL=Graph.d.ts.map
/**
 * This is going to be a generic utility file. Primarily for factoring
 * out algorithms with a higher level of computational complexity.
 */
declare function toFunc<T>(defaultValue: T, t?: T | (() => T)): (() => T);
interface Coords {
    x: number;
    y: number;
}
/**
 * Generic props for representing a box around an object.
 */
interface BoundingBox {
    top_left: Coords;
    bottom_right: Coords;
}
declare function boxUnion(boxes: BoundingBox[]): {
    top_left: {
        x: number;
        y: number;
    };
    bottom_right: {
        x: number;
        y: number;
    };
};
interface ExperimentalBoundingBox {
    lambda: (radians: number) => Coords;
}
/**
 * Simple method averaging the coordinate points in a series.
 * @param points
 * @returns
 */
declare function averagePath(points: Coords[]): Coords;
/**
 * Shifts a function list of points according to a shift variable
 * @param pointList
 * @param shift
 * @returns
 */
declare function shiftList(pointList: (() => Coords)[], shift: () => Coords): (() => Coords)[];
/**
 * Utility function returning bounding box for a list of points
 * @param pointList list of points as coords
 * @returns bounding box
 */
declare function boundsOfList(pointList: Coords[]): BoundingBox;
//# sourceMappingURL=Utility.d.ts.map
/**
 * Interface for node in a tree with a visualObject
 */
interface VisTree {
    visualObject: VisualObject;
    children: VisTree[];
}
interface TreeProps {
    root: VisTree;
    height: number;
    width: number;
    coords?: Coords | (() => Coords);
    edgeColor?: string;
    edgeWidth?: number;
}
declare class Tree extends VisualObject {
    root: VisTree;
    height: number;
    width: number;
    private lines;
    private subTrees;
    private coords;
    /**
     * Builds a tree object, pulling all children nodes into proper locations and
     * adding lines where necessary.
     * @param root root of the tree of visual objects
     * @param height height of box to bound the tree
     * @param width width of box to bound the tree
     * @param coords top left point of the tree
     */
    constructor(props: TreeProps);
    private setUpSubtrees;
    setLineColor(color: string): void;
    setLineWidth(width: number): void;
}
//# sourceMappingURL=Tree.d.ts.map
`