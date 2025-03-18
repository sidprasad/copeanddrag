#lang forge

sig RbNod {
  value: one Int,  
  left: lone RbNod, 
  right: lone RbNod
}

sig Black extends RbNod {}
sig Red extends RbNod {}
sig RBLeaf extends Black {}




pred leafsareleafs {
    all n : RbNod | {
         ((no n.left) and (no n.right)) iff (n in RBLeaf)
    }
}

inst z {

    RbNod = `N0 + `N1 + `N2 + `N3 + `N4 + `N5 + `N6 + `N7 + `N8 + `N9 + `N10
    Black = `N0 + `N5 + `N6 + `N7 + `N8 + `N9 + `N10 + `N1
    Red =  `N2 + `N3 + `N4
    value = `N0 -> 5 + `N1 -> 1 + `N2 -> 6 + `N3 -> 2 + `N4 -> 1 + `N5 -> 0 + `N6 -> 0 + `N7 -> 0 + `N8 -> 0 + `N9 -> 0 + `N10 -> 0
    left = `N0->`N1 + `N1->`N3 + `N3->`N4 + `N4->`N9 + `N2->`N7
    right = `N0->`N2 + `N2->`N8 + `N1->`N5 + `N3->`N6 + `N4->`N10
}

run leafsareleafs for z