const stage = new Stage()


const rect = new Rectangle({width: 50, height: 50, center: {x:200, y:50}})
const circ1 = new Circle({radius: 25, center: {x:100, y:300}})
const circ2 = new Circle({radius: 25, center: {x:350, y:300}})

const edge1 = new Edge({
    obj1: rect, obj2: circ1,
    textProps: {text: "e1"},
    textLocation: "above"
})
const edge2 = new Edge({obj1: circ1, obj2: rect,
    textProps: {text: "e2"},
    textLocation: "below"})
const edge3 = new Edge({obj1: circ1, obj2: circ2,
    textProps: {text: "e3"},
    textLocation: "above"})
const edge4 = new Edge({obj1: rect, obj2: circ2,
    textProps: {text: "e4"},
    textLocation: "above"})

stage.add(rect)
stage.add(circ1)
stage.add(circ2)

stage.add(edge1)
stage.add(edge2)
stage.add(edge3)
stage.add(edge4)

stage.render(svg, document)
