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

pred topRight[ tr : Cell ] {

    all x: (Cell - tr) | x in tr.^(down + ~right)

    // Topmost row
    all r : tr.*right | 
    {
        no (down.r)    // Top row has nothing above it
        //#(r.down) = #(tl.*down)   // All rows have the same number of cells

    }

    // Leftmost columm
    all c : (tr.*down) | {
        no c.right   // Left column has nothing to the left of it
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

/* MICHAEL'S PREDICATES */

pred horizontal_winner[c: Cell, m: Mark] {
    // Every Cell to the left and right of this cell have some mark and the same mark
    all lc: *right.c, rc: c.*right | {
        one lc.mark
        one rc.mark
        lc.mark = m
        rc.mark = m
    }
}

pred vertical_winner[c: Cell, m: Mark] {
    // Every Cell up and down of this cell have some mark and the same mark
    all uc: *down.c, dc: c.*down | {
        one uc.mark
        one dc.mark
        uc.mark = m
        dc.mark = m
    }
}

pred diagonal_winner[c: Cell, m: Mark] {
    // Every Cell in the left-to-right diagonal of this cell have some mark and the same mark
    (
        topLeft[c] and
        (all udc: *(right.down).c, ddc: c.*(right.down) | {
            one udc.mark
            one ddc.mark
            udc.mark = m
            ddc.mark = m
        })
    ) or (
        topRight[c] and
        // Every Cell in the right-to-left diagonal of this cell have some mark and the same mark
        (all udc: *(~right.down).c, ddc: c.*(~right.down) | {
            one udc.mark
            one ddc.mark
            udc.mark = m
            ddc.mark = m
        })
    )
}

pred winner[m : Mark] {
    some c: Cell | {
        horizontal_winner[c, m] or
        vertical_winner[c, m] or
        diagonal_winner[c, m]
    }
}

pred wins[c1, c2, c3: Cell] {
    one c1.mark
    one c2.mark
    one c3.mark
    c1.mark = c2.mark and c2.mark = c3.mark
    (c1.right = c2 and c2.right = c3) or
    (c1.down = c2 and c2.down = c3) or
    (c1.right.down = c2 and c2.right.down = c3)
}

pred xwins {
    winner[X]
}

pred owins {
    winner[O]
}

pred exactly_one_winner {
    winner[X] implies not winner[O]
    winner[O] implies not winner[X]
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

// run {
//     ttt
//     owinner_diag
// } for exactly 9 Cell for xo

// run nonsquare for exactly 9 Cell for xo

// Run a specific kind of winning game
run {
    ttt
    exactly_one_winner
    some c: Cell, m: Mark | diagonal_winner[c, m]
} for exactly 9 Cell for xo

// Run a double win game
run {
    ttt
    some c: Cell, m: Mark | vertical_winner[c, m] and horizontal_winner[c, m]
}

