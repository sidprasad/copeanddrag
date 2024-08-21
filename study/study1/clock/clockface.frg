#lang forge

abstract sig Mark {

    next : one Mark
}

one sig XII extends Mark {}
one sig III extends Mark {}
one sig VI extends Mark {}
one sig IX extends Mark {}


sig Clock {
    hour : one Mark,
    minute : one Mark
}

pred wellformed {
    Mark = XII + III + VI + IX
    XII.next = III
    III.next = VI
    VI.next = IX
    IX.next = XII
}

pred notSame {
    no c : Clock | c.hour = c.minute
}

run {
    wellformed 
notSame
}for exactly 1 Clock

