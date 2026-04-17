# D3FX Helpers

The D3FX helpers library was designed as an interface between sterling users and the D3 library in Javascript. Because D3 is a very big library, it can be hard to pick up on a whim, especially with the restricted use of instance visualization. 

Because of this, a library of useful shapes and objects has been created. This library requires some knowledge of javascript, but it's object-oriented design is meant to be more user-friendly for those without much experience in the language. 

## The Stage and VisualObjects

Everything on the screen is represented in the form of a `VisualObject`, which includes shapes like squares or circles, and more complicated objects like grids or trees.

To render visual objects, a `Stage` object needs to be created to contain them. After creating, the user can call `stage.add(...)` to contain a visual object. To render all added VisualObjects, call `stage.render(...)`. Below is some important information for interacting with these objects, specifically for those without javascript experience.

### Props and Optional Parameters

All `VisualObject`s will take in a props object. Props objects have a number of fields with designated types. These types can be entered in any order with their corresponding names. For example:  
```
new Rectangle({
    height: 100,
    width: 200,
    coords: {x: 100, y: 50},
    color: 'red',
    label: 'Hello'
})
```
For ease of use, we've written out each of these props objects in terms of an `interface` object, like the following:
```
interface Coords {
    x: number,
    y: number
}
```
While these definitions are useful tools, these `interface` structures **do not** exist in javascript in a meaningful way. Each of these interface objects exists only in typescript, a strongly typed superset of javascript in which the sterling visualizer is written. 

With all this said, instantiating a props object with `{field1: value, field2: value, ...}` will still be understood by the library as if javascript understood this wider interface system. Lastly, fields in a props object may include a `?`. This denotes that the field is optional.

### Lambda Functions

When implementing one of the classes listed later on, you may be prompted with a type hint of the form `text: string | () => string`. This means that the field `text` can take in either or a string, or an anonymous funtion that produces a string. For simple use, you can more or less ignore this distinction, and choose only to pass in a string. For ease of reading, any type of this form (`T | () => T`) has just been collapsed to just `T` in all library documentation.

## Primitive Objects

### `TextBox`

Textboxes render text to the screen at a given location, taking in a `TextBoxProps` object, of the following form:
```
interface TextBoxProps {
    text? : string,
    coords?: Coords,
    color?: string,
    fontSize?: number
}
```
Here is an example `TextBox` using these props:
```
let text = new TextBox({
    text: 'hello',
    coords: {x: 50, y:50},
    color: 'black',
    fontSize: 12
}) 
```
All parameters can be changed after initiation with corresponding setter methods. 

### Shapes

The following three primative objects `Rectangle`, `Circle`, and `Polygon`. Are all instances of a wider class called `Shape`. As a result, their props objects all implement the following interface:
```
interface ShapeProps {
  color?: string,
  borderWidth?: number,
  borderColor?: string,
  label?: string,
  labelColor?: string,
  labelSize?: number,
  opacity?: number
}
```
For ease of reading, these fields will be rewritten later on where applicable.

### `Rectangle`

Rectangles take in a pair of coordinates corresponding to the top left corner of the shape, along with a width and height. The parameters object is of the following form:
```
interface RectangleProps extends shape {
    height: number,
    width: number,
    labelLocation?: string,
    coords?: Coords,

    // Borrowed from shape
    color?: string,
    borderWidth?: number,
    borderColor?: string,
    label?: string,
    labelColor?: string,
    labelSize?: number,
    opacity?: number
}
```
The value of `label-location` can be `"center"` (default). Other options include `"topLeft"`, `"topRight"`, `"bottomLeft"`, and `"bottomRight"`, which will generate text outside the rectangle in these locations. Here is an example `Rectangle` using these props:
```
let rect = new Rectangle({
    coords: {x: 100, y:100},
    height: 20,
    width: 20,
    color: "pink",
    borderColor: "black",
    borderWidth: 2,
    label: "5"
})
```
### `Circle`

Circles take in a pair of coordinates as the center and a radius, along with the rest of the following props object:
```
interface CircleProps extends ShapeProps {
    radius: number,

    // Borrowed from shape
    color?: string,
    borderWidth?: number,
    borderColor?: string,
    label?: string,
    labelColor?: string,
    labelSize?: number,
    opacity?: number
}
```
The text in the `label` will render in the center of the circle. Here is an example circle:
```
let circ = new Circle({
    radius: 10, 
    center: {x: 100, y:100}, 
    color: 'aqua', 
    borderWidth: 2, 
    borderColor: 'black', 
}); 
```

### `Polygon`

Polygons are the most generic of the shapes offered in D3Helpers. They take in any list of points, and create a shape with those points on the perimiter. The props are of the form:
```
export interface PolygonProps extends ShapeProps {
    points: Coords[]

    // Borrowed from shape
    color?: string,
    borderWidth?: number,
    borderColor?: string,
    label?: string,
    labelColor?: string,
    labelSize?: number,
    opacity?: number
}
```
The label will be generated in roughly the center of the shape (the mean of the points entered). Here is an example of a polygon being used to create a (nonconvex) pentagon. 
```
polypoints = [
    {x:100, y:200},
    {x:200, y:200},
    {x:175, y:150},
    {x:200, y:100},
    {x:100, y:100}
]

let poly = new Polygon({
    points: polypoints, 
    color: 'orange', 
    borderWidth: 2, 
    borderColor: 'black', 
    label: "Hi!",
    labelColor: "black" ,
    opacity: 0.7
});
```

### `Line`

Line takes in a series of points, and creates a line passing through said points. 
```
interface LineProps {
  points?: Coords[], 
  arrow?: boolean,
  color?: string, 
  width?: number,
  opacity?: number
  style?: string
}
```
If `arrow` is true, the end of the line will have a small arrowhead. Style can take the values of `'dotted'` or `'dashed'`Here's an example line:
```
linepoints = [
    {x:100, y:100},
    {x:125, y:100},
    {x:150, y:75},
    {x:200, y:125},
    {x:225, y:100},
    {x:250, y:100}
]

let line = new Line({
    points: linepoints, 
    color: 'black', 
    width: 2, 
    labelColor: "blue",
    arrow: true,
    style: "dotted"
});
```

## Compound Objects

While the above objects are good for simple visualizations, it's often difficult to write code for more complicated visuals implementing these objects. With this in mind, there are a number of compound objects, which take in some data and produce a desired visualization.

Notably, the subobjects of a compound object (some examples of which will be see very soon), do not need to be manually added to the stage, and instead will render as a consequence of rendering the larger compound object. 

### `Grid`

Grids allow the user to create an arrangement of different visual objects in a 2-dimensional arrangement of cells. The grid takes in the following props:
```
interface gridProps{
    grid_location: Coords, // Top left corner
    cell_size:{
        x_size:number,
        y_size:number
    },
    grid_dimensions:{
        x_size:number,
        y_size:number
    },
}
```
The `grid_dimensions` field should be a pair of positive integers, referring to the width and height of the array, respectively. The `cell_size`, in pixels, will be the size of each of these objects. Grids also offer the `add` method to fill these cells with `VisualObject`s:
```
add(
    coords: Coords, 
    add_object:VisualObject, 
    ignore_warning?:boolean
)
``` 
The coordinates should be integers designating which cell to add the visualObject to. Notably, the visualObject's Coordinates will immediately be adjusted to fit the cell, so visualObjects created to be added to a cell do not need coordinates. 

The program will produce an error if the passed in visualObject does not fit into the given cell. To ignore this error, set `ignore_warning` to true. 

Here is an example of a simple grid:

```
let grid = new Grid({
    grid_location: {x: 50, y:50},
    cell_size: {x_size: 30, y_size: 30},
    grid_dimensions: {x_size: 4, y_size: 5}
})

console.log(grid)
grid.add({x: 0, y: 1}, new Circle({radius: 10, color: "red"}))
grid.add({x: 3, y: 3}, new Circle({radius: 10, color: "blue"}))
```
Here we have a 4x4 grid of 30x30 pixel squares, into two of which we place circles. Note that the circles added to the grid do not have coordinates. This is because the coordinates of these shapes are immediately changed to be in the center of the given squares in the grid. 

### `Tree`

The `Tree` object allows for visualization of a typical "tree" structure in the computer science sense. The nodes in the tree object are given in terms of visualobjects, which will then be registered with lines between them. The props for `Tree` are as follows:
```
interface TreeProps {
    root: VisTree, 
    height: number, 
    width: number, 
    coords?: Coords, 
    edgeColor?: string, 
    edgeWidth?: number
}
```
Where `VisTree` is the following interface, which logically represents a tree and its subtrees:
```
interface VisTree{
    visualObject: VisualObject,
    children: VisTree[]
}
```
When rendered, the tree will be adjusted to exactly fit into the box with top-left corner designated by `coords` and dimensions designated by `height` and `width`. Here is an example tree with four layers:
```
let obj1 = new Circle({radius: 10, color: 'red', borderColor: "black", label: '1'});
let obj2 = new Circle({radius: 10, color: 'red', borderColor: "black", label: '2'});
let obj3 = new Rectangle({height: 20, width: 20, color: 'green', borderColor: "black", label: '3'});
let obj4 = new Circle({radius: 10, color: 'red', borderColor: "black", label: '4'});
let obj5 = new Circle({radius: 10, color: 'red', borderColor: "black", label: '5'});
let obj6 = new Circle({radius: 10, color: 'red', borderColor: "black", label: '6'});
let obj7 = new Circle({radius: 10, color: 'blue', borderColor: "black", label: '7'});
let obj8 = new Circle({radius: 10, color: 'blue', borderColor: "black", label: '8'});

let visTree = {
  visualObject: obj1,
  children: [
    {
      visualObject: obj2,
      children: [
        { visualObject: obj4, children: [] },
        {
          visualObject: obj5,
          children: [{ visualObject: obj8, children: [] }]
        },
        { visualObject: obj7, children: [] }
      ]
    },
    {
      visualObject: obj3,
      children: [{ visualObject: obj6, children: [] }]
    }
  ]
};

let tree = new Tree({
    root: visTree, 
    height: 200, 
    width: 200, 
    coords: { x: 100, y: 100 }
    });
```

### `Edge`

Edges allow the visualizer to display relationships between objects, without requiring manual input of those objects locations. Edge objects take in the following props:
```
export interface EdgeProps {
  obj1: VisualObject;
  obj2: VisualObject;
  lineProps: LineProps;
  textProps: TextBoxProps;
  textLocation: string;
}
```
Here, `obj1` represents the first visual object, or the sourse of the edge, and `obj2` is the sink. Styling, color, width, and more attributes of the edge itself can be designated in `lineProps`, which will take in a normal line-props object and use relevant features to generate the edge (which itself is a line). Similarly, the label for the line is designated by `textProps`, which supports all relevant features used in the label textBox. 

Lastly, `textLocation` allows for freedom in determining the location of the label. By default, it will generate in the exact center of the line. However, passing in `right`, `left`, `above`, or `below` will instead generate the label of the center of the line, offset by whatever orthogonal direction is most close to the input. There is also support for `clockwise` or `counterclockwise`, which places the label in the stated location from the perspective of the source object. Here is an example of a few edges between visualObjects:

```
const rect = new Rectangle({width: 20, height: 20, coords: {x:200, y:50}})
const circ1 = new Circle({radius: 10, center: {x:150, y:200}})
const circ2 = new Circle({radius: 10, center: {x:250, y:200}})

const edge1 = new Edge({
    obj1: rect, obj2: circ1,
    textProps: {text: "e1", fontSize: 11},
    textLocation: "above"
})
const edge2 = new Edge({obj1: circ1, obj2: rect,
    textProps: {text: "e2", fontSize: 11},
    textLocation: "below"})
const edge3 = new Edge({obj1: circ1, obj2: circ2,
    textProps: {text: "e3", fontSize: 11},
    lineProps: {color: "green"},
    textLocation: "above"})
const edge4 = new Edge({obj1: rect, obj2: circ2,
    lineProps: {arrow: true},
    textProps: {text: "e4", fontSize: 11},
    textLocation: "above"})
```