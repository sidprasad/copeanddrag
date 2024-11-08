#lang forge

abstract sig Status {}
one sig Fresh extends Status {}
one sig Rotten extends Status {}


abstract sig Fruit {
    status: one Status 
}

sig Apple extends Fruit {}
sig Banana extends Fruit {}
sig Pear extends Fruit {}

sig Basket {
    fruit: set Fruit
}

pred noSpoiledFruit(b: Basket) {
    all f: b.fruit | f.status = Fresh
}

pred wellformed {
    Status = Fresh + Rotten
    all f : Fruit | {
        f in Apple + Banana + Pear
        some b : Basket | f in b.fruit
    }

    all a, b : Basket | {
        (a != b) => no (a.fruit & b.fruit)
    }

}

pred setUp {
    one b: Basket | noSpoiledFruit[b]
    //one b: Basket | #(b.fruit) = 4
    all b : Basket | #(b.fruit) > 1
}

run {
    wellformed
    setUp


 } for exactly 3 Basket, exactly 5 Apple, exactly 5 Banana, exactly 3 Pear