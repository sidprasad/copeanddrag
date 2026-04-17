### `Hull`

A hull is a customizeable wrapper for a set of objects. Given a list of objects `objs: VisualObject[]`, it will draw a minimal line encircling all of these objects. `Hull` also takes the parameters `fuzz:number` and `smooth:boolean`. `fuzz` dictates the berth given to the objects that `Hull` encircles - `fuzz: 0` will draw the smallest path around a set of objects. `smooth` dictates the shape of the hull drawn around the objects: `smooth:true` will have rounded edges (generally preferred), and `smooth:true` will have sharp corners.
```java
const points = [{x:40,y:40}, {x:140, y:40}, {x:160,y:140}, {x:40,y:140}]

const c1 = new Circle({center: p[0], radius: 5})
const c2 = new Circle({center: p[1], radius: 5})
const c3 = new Circle({center: p[2], radius: 5})
const c4 = new Circle({center: p[3], radius: 5})

const circs = [c1,c2,c3,c4]

const h = new Hull({objs: circs, fuzz: 40, smooth: true})

stage.add(h)
stage.addAll([c1,c2,c3,c4, h])
stage.render(svg)


```

### `addMask`

`addMask` is a function inherited by all visual objects that erases a given `BoundingBox` from that object (note: a mask on one object will not affect another object, provided the other object is not a child of the first).

```java
  const rect = new Rectangle({coords: {x:0, y:0}, width: 150, height:150})

  rect.addMask(
    top_left: {x: 10, y: 10},
    bottom_right: {x: 100, y:100}
  )
```