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
    City = `Delhi + `Lahore


    XII = `XII 
    III = `III 
    VI = `VI 
    IX = `IX 
    Mark = XII + III + VI + IX

    next  =(`XII->`III + `III->`VI + `VI->`IX + `IX->`XII) 
//          +  (`xii->`iii + `iii->`vi + `vi->`ix + `ix->`xii)

    `Delhi.hour =`VI 
    `Delhi.minute =`IX

    `Lahore.hour = `VI 
    `Lahore.minute =`III 

}

run { 
    
} for IST