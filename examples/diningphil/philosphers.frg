#lang forge/temporal

sig P {
   var lFork : lone Fork,
   var rFork : lone Fork,
    rightP : one P,
    leftP : one P
}

sig Fork {}

pred wellformed {
    // There are as many forks as philosphers
    //#P = #Fork

    // Seated in a circle
    leftP = ~rightP

    all p : P | {
        P in p.^rightP
        P in p.^leftP
    }

    // Forks are either in P.lFork or P.rFork, but not in both
    no P.lFork & P.rFork
    Fork in (P.lFork + P.rFork)
    all f : Fork | one p : P | f in p.lFork or f in p.rFork

    // Now this is the hard bit. 
    // A philosphers left fork must constantly be the same.
    // This is what is wrong with the trace here!


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
} for exactly 5 P, 5 Fork
