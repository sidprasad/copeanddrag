#lang forge


sig Card {}

sig Person {
    left : one Person,
    hand : set Card
}

one sig Dealer extends Person {}


pred wellformed {

    // The table is a closed loop
    all p : Person | Person in p.^left

    all c : Card | {
        one p : Person | c in p.hand
    }

    Card in Person.hand   
}


test expect {

    nocardnotinhand : {
        wellformed
        some c : Card | {
            no p : Person | c in p.hand
        }
    } is unsat


    nocardoverlap : {
        wellformed
        some p1, p2 : Person | {
            p1 != p2
            some (p1.hand & p2.hand)
        }
    } is unsat
}




pred gamerules {
    
        // At most 3 hand
    all p : Person | #(p.hand) <= 3

    no Dealer.hand
}

pred equalcards {
    all p : Person - Dealer | {
        all p2 : (Person - Dealer) | {
            #(p.hand) = #(p2.hand)
        }
    }
}


test expect {
    v1 : {wellformed and gamerules} is sat
    nodealer : {gamerules and (some d : Dealer | some (d.hand))} is unsat

    threeok : {
        wellformed 
        gamerules 
        some p : Person | #(p.hand) = 3
      } is sat

    allthree : {
        wellformed 
        gamerules 
        all p : (Person - Dealer) | #(p.hand) = 3
        some (Person - Dealer)
      } is sat

    eq : {
        wellformed
        gamerules
        equalcards
        some (Person - Dealer)
    } is sat
}




pred dealing {
    

    all p : (Person - Dealer) | #(p.hand) >= #((p.left).hand)

    equalcards or {
        one p : (Person - Dealer) | {
            p.left not in Dealer
            subtract[#(p.hand), #((p.left).hand)] = 1 
        }
    }
}

inst dealt {
    Dealer = `Dealer
    Person = `P0 + `P1 + `P2 + `Dealer
    Card = `Card0 + `Card1 + `Card2  + `Card3 + `Card4 + `Card5 + `Card6 + `Card7 + `Card8
}

test expect {
    vac1 : {wellformed and gamerules and dealing} is sat
    vac2 : {wellformed and gamerules and dealing and equalcards} is sat
    candeal : {wellformed and gamerules and dealing and equalcards} for dealt is sat
    canpartialdeal : {wellformed and gamerules and dealing} for exactly 7 Card, exactly 4 Person is sat
   
}

run {wellformed and gamerules and dealing} for exactly 7 Card, exactly 4 Person




// test expect {
//     canbedealt : {
//         wellformed
//         gamerules
//         dealt
//         dealing
//     } for e1 is sat
// }

// // run {
// //     wellformed
// //     dealing
// //     gamerules
// // } for e1

