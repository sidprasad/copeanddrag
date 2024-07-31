#lang forge/bsl
/*
  Tic-tac-toe example model. 
  Meant to illustrate how to serialize Forge instance output.
  
  (This could be a forge/bsl model, except that we need + to describe
   the partial instance example.)
*/

abstract sig Player {}
one sig X, O extends Player {} 

abstract sig Index {}
one sig A extends Index {}
one sig B extends Index {}
one sig C extends Index {}

sig Board {
    -- partial function: Guarantees the wellformedness as a type constraint
    places: pfunc Index -> Index -> Player
}

fun countPiece[brd: Board, p: Player]: Int {
  #{r,c: Index | brd.places[r][c] = p}
}

pred xturn[b: Board] {
  countPiece[b, X] = countPiece[b, O]
} 
pred oturn[b: Board] {
  subtract[countPiece[b, X],1] = countPiece[b, O]
}

pred winH[b: Board, p: Player] {
  some r: Index | all c: Index |
    b.places[r][c] = p
}

pred winV[b: Board, p: Player] {
  some c: Index | all r: Index |
    b.places[r][c] = p
}

pred winD[b: Board, p: Player] {
    (b.places[A][A] = p and 
     b.places[B][B] = p and
     b.places[C][C] = p)
    or
    (b.places[A][C] = p and 
     b.places[B][B] = p and
     b.places[C][A] = p)
}

pred valid[b: Board] {
  oturn[b] or xturn[b]
}
       
pred winning[b: Board, p: Player] {
  winH[b, p] or winV[b, p] or winD[b, p]
}

--------------------

pred move[pre: Board, post: Board, p: Player, r: Index, c: Index] {
    -- GUARD: no move there yet, correct turn
    no pre.places[r][c]
    p = X implies xturn[pre]
    p = O implies oturn[pre]
	  -- TRANSITION: augment post-board
	  post.places[r][c] = p
    -- TRANSITION: explicit frame condition (rest of board stays the same)
    all r2, c2: Index | (r2=r and c2=c) or post.places[r2][c2] = pre.places[r2][c2]
    -- we could combine both using relational operators (later in course)
    -- post.places = pre.places + (r->c->p)
}

one sig Trace {
    first: one Board,
    next: pfunc Board -> Board
}
pred trace {
	  -- start with empty board
	  all r, c: Index | no Trace.first.places[r][c]
    -- Potential error (easy to make when translating from Alloy)
    -- all r, c: Index | no first.places[r][c]
    
    -- always move forward (except in last state)
    all b: Board | some Trace.next[b] implies {
        some p: Player, r, c: Index | 
            move[b, Trace.next[b], p, r, c]
    }
}

--------------------
--option verbose 5
run {
    -- find me an instance illustrating a trace of tic-tac-toe
    trace
	  -- that also ends in a winning board for X
    some winningb: Board | { 
      no Trace.next[winningb] 
      winning[winningb, X]
    }
} for 9 Board, 3 Index, 2 Player for {next is linear}

-- Example instance to illustrate using a partial instance in forge/core
-- The backtick is used to indicate an _atom_, rather than a relation.
inst optimizer {
  -- Here are the _exact_ contents of the Board and Trace sigs
  Board = `Board0 + `Board1 + `Board2 + 
          `Board3 + `Board4 + `Board5 + 
          `Board6 + `Board7 + `Board8
  Trace = `Trace0 
  -- `Board0 is the first in the trace
  first = `Trace0 -> `Board0
  -- and next behaves like we want it to
  next = `Trace0 -> (
           `Board0->`Board1 + `Board1->`Board2 + `Board2->`Board3 +
           `Board3->`Board4 + `Board4->`Board5 + `Board5->`Board6 +
           `Board6->`Board7 + `Board7->`Board8)
}