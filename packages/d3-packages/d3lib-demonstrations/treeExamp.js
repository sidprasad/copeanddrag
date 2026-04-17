const r = 20;

let obj1 = new Circle({radius: r, color: 'red', borderColor: "black", label: '1'});
let obj2 = new Circle({radius: r, color: 'red', borderColor: "black", label: '2'});
let obj3 = new Rectangle({height: 20, width: 20, color: 'green', borderColor: "black", label: '3'});
let obj4 = new Circle({radius: r, color: 'red', borderColor: "black", label: '4'});
let obj5 = new Circle({radius: r, color: 'red', borderColor: "black", label: '5'});
let obj6 = new Circle({radius: r, color: 'red', borderColor: "black", label: '6'});
let obj7 = new Circle({radius: r, color: 'blue', borderColor: "black", label: '7'});
let obj8 = new Circle({radius: r, color: 'blue', borderColor: "black", label: '8'});

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
stage = new Stage()
stage.add(tree)
stage.render(svg)
