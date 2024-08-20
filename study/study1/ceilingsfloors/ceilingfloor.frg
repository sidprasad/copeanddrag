#lang forge


sig Person {}

sig Floor {
    upstairs : lone Floor,
    units : set Unit
}

sig Unit {
    occupants : set Person 
}


pred building {
    
    one top : Floor | no top.upstairs
    one ground : Floor | Floor in ground.*upstairs
    no upstairs & iden

    all p : Person | one u : Unit | p in u.occupants
    all u : Unit | one f : Floor | u in f.units
}


pred occupied {
    all f : Floor | some f.units
    all u : Unit | some u.occupants
}

run {building and occupied} for exactly 4 Floor, exactly 6 Unit, exactly 8 Person