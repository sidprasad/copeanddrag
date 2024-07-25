
export const DOMAIN_TEMPLATE = `
type _Vertex
type _Link
type _Cluster
constructor _Arc(_Vertex u, _Vertex v) -> _Link

-- What about N-ary tuples?
predicate _layoutLeft(_Vertex l, _Vertex r)
predicate _layoutAbove(_Vertex a, _Vertex b)
predicate _layoutRight(_Vertex r, _Vertex l)
predicate _layoutBelow(_Vertex b, _Vertex a)


predicate _layoutInCluster(_Cluster c, _Vertex v)
predicate _layoutNotInCluster(_Cluster c, _Vertex v)
`;

export const SUBSTANCE_TEMPLATE = ``;

/// TODO: This needs work ///
export const STYLE_TEMPLATE = `
canvas {
  width = 800
  height = 800
}

layout = [nodes, loops, arrows, text]

color {
  black = #000000
  white = #ffffff
}

num {
  radius = 5
  labelDist = 5
  edgeDist = 100
  repelDist = 1.5 * edgeDist
  offset = 10
  loopRadius = 15
  pointerX = 6
  pointerY = 4
  clusterpad = 10
}

----------- _Vertex properties ------------
forall _Vertex v {
  v.dot = Circle {
    center: (? in nodes, ? in nodes)
    r: num.radius
    fillColor : color.black
  }

  v.text = Text {
    string: v.label
    fillColor: color.black
    strokeColor: color.white
    strokeWidth: 4
    paintOrder: "stroke"
  }
  v.halfSize = (v.text.width / 2, v.text.height / 2)
  v.bottomLeft = v.text.center - v.halfSize
  v.topRight = v.text.center + v.halfSize

  v.text above v.dot

  encourage shapeDistance(v.dot, v.text) == num.labelDist in text
}


forall _Vertex u; _Vertex v {
  d = vdist(u.dot.center, v.dot.center)
  dHat = num.repelDist
  -- equation 6 from https://ipc-sim.github.io/
  encourage minimal(max(0, -sqr(d - dHat) * log(d / dHat))) in nodes

  ensure disjoint(u.text, v.text, num.labelDist) in text
}



--------- _Link properties --------
forall _Link e {
  encourage shapeDistance(e.pointer, e.text) == num.labelDist in text
  e.text = Text {
    string: e.label
    fillColor: color.black
    strokeColor: color.white
    strokeWidth: 4
    paintOrder: "stroke"
  }

  
}


forall _Vertex u; _Vertex v; _Link e where e := _Arc(u, v) {
  a = u.dot.center
  b = v.dot.center
  t = normalize(b - a) -- tangent
  n = rot90(t) -- normal
  m = (a + b) / 2 -- midpoint

  e.start = a
  e.end = b
  e.theta = angleOf(t)
  e.offset = ? in nodes
  e.arrow = Path {
    d: quadraticCurveFromPoints("open", [a, m + e.offset * n, b])
    strokeColor: color.black
  }

  e.step = ? in arrows
  e.pointerCenter = m + (e.offset / 2) * n + e.step * t
  p = e.pointerCenter
  x = num.pointerX
  y = num.pointerY
  e.pointer = Path {
    d: pathFromPoints("closed", [p - x * t + y * n, p + x * t, p - x * t - y * n])
    strokeColor: none()
    fillColor: color.black
  }

  e.arrow below u.dot
  e.arrow below v.dot
  e.pointer below e.arrow

  encourage vdist(u.dot.center, v.dot.center) < num.edgeDist in nodes
  encourage minimal(sqr(e.offset)) in nodes
  encourage minimal(sqr(e.step)) 

  
}

forall _Vertex u; _Vertex v; _Link e1; _Link e2 where e1 := _Arc(u, v); e2 := _Arc(u, v) {
  ensure abs(e2.offset - e1.offset) > 2 * num.offset in nodes
}

forall _Vertex u; _Vertex v; _Link e1; _Link e2 where e1 := _Arc(u, v); e2 := _Arc(v, u) {
  ensure abs(e1.offset + e2.offset) > 2 * num.offset in nodes
}

forall _Vertex u; _Vertex v; _Link e where e := _Arc(u, v); u has label {
  encourage maximal(min(num.labelDist, rectLineDist(u.bottomLeft, u.topRight, e.start, e.end))) in text
}

forall _Vertex u; _Vertex v; _Link e where e := _Arc(u, v); v has label {
  encourage maximal(min(num.labelDist, rectLineDist(v.bottomLeft, v.topRight, e.start, e.end))) in text
}

forall _Vertex u; _Vertex v; _Vertex w; _Link e where e := _Arc(u, v); w has label {
  encourage maximal(min(num.labelDist, rectLineDist(w.bottomLeft, w.topRight, e.start, e.end))) in text
}

forall _Vertex v; _Link e where e := _Arc(v, v) {
  e.theta = ? in loops
  n = (cos(e.theta), sin(e.theta)) -- normal
  delta = num.loopRadius * n

  e.arrow = Circle {
    center: v.dot.center + delta
    r: num.loopRadius
    strokeWidth: 1
    strokeColor: color.black
    fillColor: none()
  }

  t = rot90(n)
  p = v.dot.center + 2 * delta
  x = num.pointerX
  y = num.pointerY
  e.pointer = Path {
    d: pathFromPoints("closed", [p - x * t + y * n, p + x * t, p - x * t - y * n])
    strokeColor: none()
    fillColor: color.black
  }

  e.arrow below v.dot
  e.pointer below e.arrow
}

forall _Vertex u; _Vertex v; _Link e1; _Link e2 where e1 := _Arc(u, v); e2 := _Arc(v, v) {
  encourage maximal(cos(e2.theta - e1.theta)) in loops
}

forall _Vertex u; _Vertex v; _Link e1; _Link e2 where e1 := _Arc(v, u); e2 := _Arc(v, v) {
  encourage minimal(cos(e2.theta - e1.theta)) in loops
}

forall _Link e1, e2
where e1 := _Arc(a, b); e2 := _Arc(c, d)
with _Vertex a, b, c, d {
  ensure norm(e2.pointerCenter - e1.pointerCenter) > max(num.pointerX, num.pointerY)*3 in arrows
  encourage e1.step == e2.step
}




forall _Vertex  v {
    encourage near(v.dot, v.text)
    layer v.text above v.dot 
}

-- Do not overlap vertices
forall _Vertex v1; _Vertex v2 {
  ensure disjoint(v1.dot, v2.dot) in dots
  ensure disjoint(v1.text, v2.text) in text
}

-- Layout (directional )---------------

forall _Vertex l; _Vertex r where _layoutLeft(l, r) {
    encourage leftwards(l.dot, r.dot) in [nodes]
    ensure l.dot.center[0] > r.dot.center[0] in nodes
}


forall _Vertex r; _Vertex l where _layoutRight(r, l) {
  encourage leftwards(l.dot, r.dot) in [nodes]
  ensure l.dot.center[0] > r.dot.center[0] in nodes
}


forall _Vertex a; _Vertex b where _layoutAbove(a, b) {
    a.dot above b.dot
    ensure a.dot.center[1] > b.dot.center[1] in nodes
}

forall _Vertex b; _Vertex a where _layoutBelow(b, a) {
    a.dot above b.dot
    ensure a.dot.center[1] > b.dot.center[1] in nodes
}



-------- Clusters -------

forall _Cluster c {
  c.blob =  Rectangle  {
    center: (? in nodes, ? in nodes)
    width: ? in nodes
    height: ? in nodes
  }

  c.text = Text {
    string: c.label
    fillColor: color.black
    strokeColor: color.white
    strokeWidth: 4
    paintOrder: "stroke"
  }
  ensure contains(c.blob, c.text) in text
  encourage minimal(c.blob.height) in nodes
  encourage minimal(c.blob.width) in nodes
}

forall _Cluster c; _Vertex v where _layoutInCluster (c, v) {
  layer c.blob below v.dot
  layer c.blob below v.text 
  ensure contains(c.blob, v.dot, num.clusterpad) in nodes
  
}

forall _Cluster c; _Vertex v where _layoutNotInCluster (c, v) {
  ensure disjoint(c.blob, v.dot) in nodes
  encourage notTooClose(c.blob, v.dot) in nodes
}

forall _Cluster c; _Vertex v1; _Vertex v2
where _layoutInCluster (c, v1); _layoutInCluster (c, v2){
  encourage near(v1.dot, v2.dot) in nodes
}
`;