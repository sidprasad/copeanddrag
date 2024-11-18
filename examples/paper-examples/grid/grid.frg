#lang forge
/*
    Model of a matrix, indexed by A, B, C
*/

sig Cell {}
--one sig X, O extends Cell {} 

abstract sig Index {
    next : lone Index
}
one sig A extends Index {}
one sig B extends Index {}
one sig C extends Index {}

sig Matrix {
    -- partial function: Guarantees the wellformedness as a type constraint
    value: pfunc Index -> Index -> Cell
}

pred grid {
    all b : Matrix | {
        all i: Index | all j: Index | {
            one (b.value[i][j])
        }
    }

    next = A -> B + B -> C
}

pred uniqueCells {

    all b : Matrix | {
        all i,j, k, l : Index | {
            (b.value[i][j] = b.value[k][l]) iff (i = k and j = l)
        }
    }
}


run {grid and uniqueCells} for exactly 1 Matrix, exactly 9 Cell