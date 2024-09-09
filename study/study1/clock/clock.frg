#lang forge



abstract sig Mark {

    next : lone Mark
}
sig XII extends Mark {}
sig III extends Mark {}
sig VI extends Mark {}
sig IX extends Mark {}



sig City {
    hour : one Mark,
    minute : one Mark
}


// Time difference of 30 minutes

inst IST {
    City = `Metropolis + `Gotham


    XII = `XII 
    III = `III 
    VI = `VI 
    IX = `IX 
    Mark = XII + III + VI + IX

    next  =(`XII->`III + `III->`VI + `VI->`IX + `IX->`XII) 
//          +  (`xii->`iii + `iii->`vi + `vi->`ix + `ix->`xii)

    `Metropolis.hour =`VI 
    `Metropolis.minute =`IX

    `Gotham.hour = `VI 
    `Gotham.minute =`III 

}

run { 
    
} for IST