#lang forge


one sig Dealer {}

 sig Player {
    left : one Player,
    right : one Player,
    holding : lone Dealer
}

// sig Visitor extends Player {}
// sig Host extends Player {}

pred wellformed {
    all p : Player |   {
        Player in p.^left // The table is a closed loop
    }
    one holding // One dealer

    right = ~left // Everyone is sitting next to someone
}

// Small blind is one Player clockwise (to the left) of the dealer
// Big blind is two people clockwise (to the left) of the dealer


pred smallBlind[p : Player] {
    
    one d : Player | {
        some (d.holding )
        p = d.left
    }
}

pred bigBlind[p : Player] {
    one sb : Player | {
        smallBlind[sb]
        p = sb.left
    }
}




run {
    wellformed
} for exactly 7 Player, 1 Dealer

// Who is the big blind?

// Who is the second player who can fold?