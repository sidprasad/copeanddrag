#lang forge/temporal

sig P {
    left : one P,
    forks : set Fork,
}


one sig Hypatia extends P {}
one sig Nagarjuna extends P {}
one sig Arendt extends P {}
one sig Zhuangzi extends P {}
one sig IbnSina extends P {}

sig Fork {}

pred wellformed {
    // Seated in a circle
    all p : P | {
        P in p.^leftP
    }

    // Forks are either in P.lFork or P.rFork, but not in both
    no P.lFork & P.rFork
    Fork in (P.lFork + P.rFork)
    all f : Fork | one p : P | f in p.lFork or f in p.rFork
}

pred nonStarvation  {
    all p : P | {
        eventually {
            some p.lFork
            some p.rFork
        }
    }
}


run {
    always wellformed
    //always nonStarvation
} for exactly 5 P, exactly 5 Fork
