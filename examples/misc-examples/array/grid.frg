#lang forge

sig Array {
    values : set Int->Cell,
    n : one Int
}

sig Cell {}

pred wellFormed[a : Array] {

    // The grid is a square
    all i: Int | {
        (i >= 0 && i < a.n) => one ((a.values)[i])
        (i < 0 or i >= a.n) => no ((a.values)[i])
    }

    all disj i, j : Int | (i >= 0 && i < a.n && j >= 0 && j < a.n) => ((a.values)[i] != (a.values)[j])

}

pred threearray  {
    all a : Array | {
        wellFormed[a]
        
    }
    n = Array->3
}

run  threearray for exactly 1 Array