#lang forge



abstract sig Unit {
}

sig Residential extends Unit {}
sig Commercial extends Unit {}

sig Floor {
    upstairs : lone Floor,
    blockA : set Unit,
    blockB : set Unit
}




pred floorStructure {
    
    one top : Floor | no top.upstairs
    one ground : Floor | Floor in ground.*upstairs
    no upstairs & iden
}


pred unitStructure {

    all u : Unit | one f : Floor | u in (f.blockA + f.blockB)
    no (blockA & blockB)
    all f : Floor | some f.blockA and some f.blockB

}

pred zoning {

    Unit = Residential + Commercial

    all f : Floor | f.blockA in Residential


}


pred building {
    floorStructure
    unitStructure
    zoning
}



// Zoning policy has one wing residential and one mized-use

run {building} for exactly 3 Floor, exactly 4 Commercial, exactly 4 Residential