const r = 20;
const max_depth = 5

function makeNewCircle(idx) {
  return new Circle({radius: r, color: 'red', borderColor: "black", label: idx});
}
function chain(depth) {
    if(depth <= 0) return {visualObject: makeNewCircle(depth), children:[]}
    return {visualObject: makeNewCircle(depth), children:[chain(depth-1)]}
}

let tree = new Tree({
    root: chain(max_depth), 
    height: 400, 
    width: 150, 
    coords: { x: 100, y: 100 }
    });
stage = new Stage()
stage.add(tree)
stage.render(svg)
