#lang forge


abstract sig Mark {}
one sig X extends Mark {}
one sig O extends Mark {}

// Define the Cell signature with relations to neighboring cells
sig Cell {
    down: lone Cell,
    right: lone Cell,
    mark: lone Mark
} 


pred topLeft[ tl : Cell ] {

    all x: (Cell - tl) | x in tl.^(down + right)

    // Topmost row
    all r : tl.*right | 
    {
        no (down.r)    // Top row has nothing above it
        //#(r.down) = #(tl.*down)   // All rows have the same number of cells

    }

    // Leftmost columm
    all c : (tl.*down) | {
        no right.c   // Left column has nothing to the left of it
        //#(c.right) = #(tl.*right)   // All columns have the same number of cells
    }
}



pred grid {
    one tl: Cell | topLeft[tl]
    //one br: Cell | bottomRight[br]

    // Ensure that down and right are acyclic
    no c: Cell | c in c.^(down + right)

    all c : Cell {
        lone (down.c)
        lone (right.c)
        (some c.right) implies { #(c.^down) = #((c.right).^down) }
        (some c.down) implies { #(c.^right) = #((c.down).^right) }
    }

    // Down and right are disjoint
    no (right & down)
}


pred square_grid {
    grid
    all c : Cell | topLeft[c] => (#(c.^down) = #(c.^right))
}

pred ttt {
    square_grid
}

pred nonsquare {
    grid
    not square_grid // THIS IS THE BUG
    some down
    some right
}


inst xo {
    X = `X
    O = `O
    Mark = X + O
}

pred owinner_diag {
    ttt
    some c1, c2, c3: Cell | {
       
       c1.mark = O and c2.mark = O and c3.mark = O
       
       topLeft[c1]
       c2 = c1.right.down
       c3 = c2.right.down

       //all c : (Cell - (c1 + c2 + c3)) | c.mark != O

    }

    

    # ({c : Cell |  c.mark = O}) = #({c : Cell | c.mark = X}) 


}


run {
    ttt
    owinner_diag
} for exactly 9 Cell for xo


//run nonsquare for exactly 9 Cell for xo
