#lang forge



abstract sig Mark {

    next : lone Mark
}
sig XII extends Mark {}
sig III extends Mark {}
sig VI extends Mark {}
sig IX extends Mark {}



sig Clock {
    hour : one Mark,
    minute : one Mark
}






inst DC {
    Clock = `Gotham + `Metropolis


    XII = `XII + `xii
    III = `III + `iii
    VI = `VI + `vi
    IX = `IX + `ix
    Mark = XII + III + VI + IX

    next  =(`XII->`III + `III->`VI + `VI->`IX + `IX->`XII) +
            (`xii->`iii + `iii->`vi + `vi->`ix + `ix->`xii)

    `Gotham.hour =`VI 
    `Gotham.minute =`IX

    `Metropolis.hour = `iii 
    `Metropolis.minute =`vi 

}

run { 
    
} for DC