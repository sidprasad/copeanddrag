#lang forge

abstract sig Node {
    next: lone Node
}

one sig A extends Node {}
one sig B extends Node {}
one sig C extends Node {}
one sig D extends Node {}

inst n1 {

    
    A = `A
    B = `B
    C = `C
    D = `D
    Node = A + B + C + D
    next = `A -> `B + `B -> `C + `C -> `D 
}


run {} for n1