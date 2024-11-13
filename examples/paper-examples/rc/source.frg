#lang forge/temporal

option max_tracelength 12
option min_tracelength 12

---------- Definitions ----------

abstract sig Position {
    var animals: set GWAnimal
}
one sig Near extends Position {}
one sig Far extends Position {}

abstract sig GWAnimal {}
sig Goat extends GWAnimal {}
sig Wolf extends GWAnimal {}

one sig GWBoat {
    var location: one Position
}

pred GWvalidState {
     // For this problem, valid states are ones which are physically reasonable:
    //  - animals should be on one side or the other, but not both
    no a: GWAnimal | a in Near.animals and a in Far.animals
    GWAnimal = Near.animals + Far.animals
    // - boat must be on a side
    GWBoat.location = Near or GWBoat.location = Far
}

// Each of the predicates below should *assume* valid states
// but should *not enforce* valid states.

pred GWinitState {
    // All of the animals and the boat should start on the near side
    GWAnimal = Near.animals
    GWBoat.location = Near
}

pred GWfinalState {
    // We want to see all of the animals reach the far side.
    GWAnimal = Far.animals
}

pred GWmove[to, from: Position] {
    // The boat can carry at most two animals each way,
    // but it can't travel across the river on its own.
    GWBoat.location = from
    GWBoat.location' = to
    // One animal will cross iff a1 == a2
    some a1, a2: GWAnimal | {
        a1 in from.animals
        a2 in from.animals
        from.animals' = from.animals - (a1 + a2)
        to.animals' = to.animals + (a1 + a2)
    }
}

-----------------------------------------

pred GWneverEating {
    // If the sheep are out numbered on one of the sides,
    // then the wolves can overpower and eat them!
    // Check to see if we can avoid that.
    // Need the implication since we don't know if there are any goats to be outnumbered
    #{g: Goat | g in Near.animals} > 0 implies (#{w: Wolf | w in Near.animals} <= #{g: Goat | g in Near.animals})
    #{g: Goat | g in Far.animals} > 0 implies (#{w: Wolf | w in Far.animals} <= #{g: Goat | g in Far.animals})
}

pred GWtraces {
    GWinitState
    eventually GWfinalState
    always GWvalidState
    always GWneverEating
    always (GWmove[Near, Far] or GWmove[Far, Near])
}

run {
    GWtraces
} for exactly 6 GWAnimal, exactly 3 Goat, exactly 3 Wolf

