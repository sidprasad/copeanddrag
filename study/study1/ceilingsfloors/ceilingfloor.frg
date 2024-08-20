#lang forge


// Apartment complex


sig Person {}

sig Floor {
    above : lone Floor,
    units : set Unit
}

sig Unit {
    occupants : set Person // Group on this
}


pred building {
    all f : Floor | f.above in f.^above
    one top : Floor | no top.above
    one ground : Floor | Floor in ground.*above
    no above & iden

    all p : Person | one u : Unit | p in u.occupants

    all u : Unit | one f : Floor | u in f.units
}

run building for exactly 4 Floor