#lang forge/temporal

option max_tracelength 12
option min_tracelength 12

option run_sterling "goats_and_wolves.cnd"

---------- Definitions ----------

abstract sig GWPosition {
    var gw: set GWAnimal
}
one sig GWNear extends GWPosition {}
one sig GWFar extends GWPosition {}

abstract sig GWAnimal {}
sig Goat extends GWAnimal {}
sig Wolf extends GWAnimal {}

one sig GWBoat {
    var gwlocation: one GWPosition
}

pred GWvalidState {
     // For this problem, valid states are ones which are physically reasonable:
    //  - animals should be on one side or the other, but not both
    no a: GWAnimal | a in GWNear.gw and a in GWFar.gw
    GWAnimal = GWNear.gw + GWFar.gw
    // - boat must be on a side
    GWBoat.gwlocation = GWNear or GWBoat.gwlocation = GWFar
}

// Each of the predicates below should *assume* valid states
// but should *not enforce* valid states.

pred GWinitState {
    // All of the animals and the boat should start on the near side
    GWAnimal = GWNear.gw
    GWBoat.gwlocation = GWNear
}

pred GWfinalState {
    // We want to see all of the animals reach the far side.
    GWAnimal = GWFar.gw
}

pred GWmove[to, from: GWPosition] {
    // The boat can carry at most two animals each way,
    // but it can't travel across the river on its own.
    GWBoat.gwlocation = from
    GWBoat.gwlocation' = to
    // One animal will cross iff a1 == a2
    some a1, a2: GWAnimal | {
        a1 in from.gw
        a2 in from.gw
        from.gw' = from.gw - (a1 + a2)
        to.gw' = to.gw + (a1 + a2)
    }
}

-----------------------------------------

pred GWneverEating {
    // If the sheep are out numbered on one of the sides,
    // then the wolves can overpower and eat them!
    // Check to see if we can avoid that.
    // Need the implication since we don't know if there are any goats to be outnumbered
    #{g: Goat | g in GWNear.gw} > 0 implies (#{w: Wolf | w in GWNear.gw} <= #{g: Goat | g in GWNear.gw})
    #{g: Goat | g in GWFar.gw} > 0 implies (#{w: Wolf | w in GWFar.gw} <= #{g: Goat | g in GWFar.gw})
}

pred GWtraces {
    GWinitState
    eventually GWfinalState
    always GWvalidState
    always GWneverEating
    always (GWmove[GWNear, GWFar] or GWmove[GWFar, GWNear])
}

run {
    GWtraces
} for exactly 6 GWAnimal, exactly 3 Goat, exactly 3 Wolf

// test expect {
//   sat3G3W: traces
//     for exactly 6 Animal, exactly 3 Goat, exactly 3 Wolf
//     is sat
//   sat2G2W: traces
//     for exactly 4 Animal, exactly 2 Goat, exactly 2 Wolf
//     is sat
// }

// pred ag_problemSolves {
//     traces => eventually finalState
// }

// pred ag_validStateAllAllocated {
//     validState => (Animal = Near.animals + Far.animals)
// }

// pred ag_validStateNoOverlap {
//     validState => { no a: Animal | a in Near.animals and a in Far.animals }
// }

// pred ag_validStateBoatOnSide {
//     validState => (Boat.location = Near or Boat.location = Far)
// }

// pred ag_initAllNear {
//     initState => Animal = Near.animals
// }

// pred ag_initNearBoat {
//     initState => Boat.location = Near
// }

// pred ag_finalAllFar {
//     finalState => Animal = Far.animals
// }

// pred ag_nearEatingTest {
//    (#{w: Wolf | w in Near.animals} > #{g: Goat | g in Near.animals} and (#{g: Goat | g in Near.animals} != 0)) => not neverEating
// }

// pred ag_farEatingTest {
//    (#{w: Wolf | w in Far.animals} > #{g: Goat | g in Far.animals} and (#{g: Goat | g in Far.animals} != 0)) => not neverEating
// }

// test expect {
//     ag_test_problemSolves: { ag_problemSolves } for exactly 6 Animal, exactly 3 Goat, exactly 3 Wolf is checked
//     ag_test_validStateAllAllocated: { ag_validStateAllAllocated } for exactly 6 Animal, exactly 3 Goat, exactly 3 Wolf is checked
//     ag_test_validStateNoOverlap: { ag_validStateNoOverlap } for exactly 6 Animal, exactly 3 Goat, exactly 3 Wolf is checked
//     ag_test_validStateBoatOnSide: { ag_validStateBoatOnSide } for exactly 6 Animal, exactly 3 Goat, exactly 3 Wolf is checked
//     ag_test_initAllNear: { ag_initAllNear } for exactly 6 Animal, exactly 3 Goat, exactly 3 Wolf is checked
//     ag_test_initNearBoat: { ag_initNearBoat } for exactly 6 Animal, exactly 3 Goat, exactly 3 Wolf is checked
//     ag_test_finalAllFar: { ag_finalAllFar } for exactly 6 Animal, exactly 3 Goat, exactly 3 Wolf is checked
//     ag_test_nearEatingTest: { ag_nearEatingTest } for exactly 6 Animal, exactly 3 Goat, exactly 3 Wolf is checked
//     ag_test_farEatingTest: { ag_farEatingTest } for exactly 6 Animal, exactly 3 Goat, exactly 3 Wolf is checked
// }



-- racket goats_and_wolves.frg -O sterling_port 17100
-- then open http://localhost:8081?17100 in a web browser