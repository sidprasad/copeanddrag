#lang forge


// TODO: Make this multiple tables (a banquet) with multiple people at each table.
// This sells the idea of the implied closure (--> Gestalt principle of closure)

// How can we have food shown better?

abstract sig Food {}
one sig Egg extends Food {}
one sig Ham extends Food {}
one sig Chicken extends Food {}
one sig Cheese extends Food {}


sig Table {
}

abstract sig Person {
    right : one Person,
    eating : one Food,
    table : one Table
}

sig Liliput extends Person {}
sig Blefuscu extends Person {}
sig Brobdingnag extends Person {}



pred wellformed {
    Food = Egg + Ham + Chicken + Cheese
    Person = Liliput + Blefuscu + Brobdingnag
    
    // This is not it. Make sure that we have tables suggested
    // by the right relation.
    all p : Person |   {
        
        p in p.^right // The table is a closed loop

        all p1 : p.^right | p1.table = p.table // Everyone at the table is at the same table

        p != p.right // Not the only person at the table
    }

    // All tables are occupied
    all t : Table | {
        some p : Person | p.table = t
    }
}

pred avoidWar {
    no l : Liliput, b : Blefuscu | {
        l.right = b or b.right = l
        l.eating = Egg or b.eating = Egg
    }
}

pred war {
    one l : Liliput, b : Blefuscu | {
        l.right = b or b.right = l
        l.eating = Egg or b.eating = Egg
    }
}

run {
    wellformed
    war
} for exactly 3 Liliput, exactly 4 Blefuscu, exactly 3 Brobdingnag, exactly 3 Table