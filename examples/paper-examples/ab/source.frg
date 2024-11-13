#lang forge

one sig A {}
one sig B {}

inst ab {
    A = `A
    B = `B
}

run {} for ab
