#lang forge


sig Card {}

sig Person {
    left : one Person,
    cards : set Card
}

one sig Dealer extends Person {}


pred wellformed {

    // Cards are in hands
    all c : Card | {
        one p : Person | {
            c in p.cards
        }
    }

    // The table is a closed loop
    all p : Person | {
        Person in p.^left
    }

    
}

pred gamerules {
    
        // At most 3 cards
        all p : Person | {
            #(p.cards) <= 3
        }

        no Dealer.cards
}


pred dealing {
    

    all p : (Person - Dealer) | {

        #(p.left.cards) <= #(p.cards)

        // If the person to your left is NOT the dealer, they have, at most one fewer card than you.
        //(p.left not in Dealer) implies
         subtract[#(p.cards), #(p.left.cards)] <= 1 

        }

    lone p : (Person - Dealer) | {
        p.left not in Dealer
         subtract[#(p.cards), #(p.left.cards)] = 1 
    }
}

run {
    wellformed
    dealing
    gamerules
    some Card
} for exactly 4 Person, exactly 1 Dealer, exactly 4 Card

