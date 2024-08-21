#lang forge


one sig Microphone {}

abstract sig Person {
    left : one Person,
    holding : lone Microphone
}

sig Visitor extends Person {}
sig Host extends Person {}




pred wellformed {
    
    all p : Person |   {
        Person in p.^left // The table is a closed loop
    }
    one holding // Someone is holding the microphone
}

pred protocol {
    all h : Host | {
        h.left in Visitor
    }
}

pred slightlyBrokenProtocol {
    one v : Visitor |
    {
        v.left in Visitor
    }
}


run {
    wellformed
    slightlyBrokenProtocol
    
} for exactly 5 Host, exactly 5 Visitor

/*
    - Are they sitting in accordance with protocol?
    - If each person has to a 

*/