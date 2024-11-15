#lang forge

sig Grid {
    values : set Int->Int->Int,
    n : one Int
}

pred squareGrid[g : Grid] {

    // The grid is a square
    all i, j : Int | (i >= 0 && i < g.n && j >= 0 && j < g.n) => one ((g.values)[i][j])

}

pred onethreebythree  {
    all g : Grid | {
        squareGrid[g]
        
    }
    n = Grid->3
}

run  onethreebythree for exactly 1 Grid