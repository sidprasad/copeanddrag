#lang forge/bsl

/*
  Model of a ripple-carry adder circuit. Adapted from an Alloy model of the same by 
  Julianne Rudner. Although the carrying can be thought of as temporal, here we model 
  the entire process as one monolithic execution -- i.e., with no propagation delay.
*/

/********************/
/* Data definitions */
/********************/

// Booleans
abstract sig Bool {}
one sig True, False extends Bool {}

// Full adders, which will be chained together to form the ripple-carry adder
sig FA { 
  -- input and output bits 
  a, b: one Bool,  
  -- input carry bit
  cin: one Bool,
  -- output value
  s: one Bool,
  -- output carry bit 
  cout: one Bool
}

// The ripple carry adder, which chains together all the full adders
one sig RCA {
  -- the first full adder in the chain
  firstAdder: one FA,
  -- the next full adder in the chain (if any)
  nextAdder: pfunc FA -> FA
}

/******************/
/* Wellformedness */ 
/******************/

pred wellformed {
  -- there's some FA upstream from all other FAs
  all fa: FA | (fa != RCA.firstAdder) implies reachable[fa, RCA.firstAdder, RCA.nextAdder]
  -- there are no cycles 
  all fa: FA | not reachable[fa, fa, RCA.nextAdder]  
}

test expect {
    {wellformed} is sat
}

/**********************************************************************/
/* System predicates: define how each full adder behaves in isolation */ 
/**********************************************************************/

// What is the output bit for this full adder?
fun adder_S_RCA[f: one FA]: one Bool  {
  // Note: because "True" and "False" are values in the model, we cannot use them directly as Forge formulas.
  let A = (f.a = True), B = (f.b = True), CIN = (f.cin = True) |
	 ((A and B and CIN) or 
      (A and (not B) and (not CIN)) or 
      ((not A) and B and (not CIN)) or 
      ((not A) and (not B) and CIN))
	 	=> True else False
} 

// What is the output carry bit for this full adder?
fun adder_cout_RCA[f: one FA]: one Bool {
 let A = (f.a = True), B = (f.b = True), CIN = (f.cin = True) |
     ((not A and B and CIN) or 
      (A and not B and CIN) or 
      (A and B and not CIN) or 
      (A and B and CIN)) 
	    => True else False
} 

// Constrain each full adder to behave as expected
pred add_per_unit[f: FA] {
  f.s = adder_S_RCA[f]
  f.cout = adder_cout_RCA[f]
  (some RCA.nextAdder[f]) implies (RCA.nextAdder[f]).cin = f.cout -- NOTE: yes, the parens are needed on the RHS here.
}

/*****************************************************/
/* Top-level system specification: compose preds above
/*****************************************************/

pred rca {  
  wellformed
  all f: FA | add_per_unit[f] 
}


// Specific example: add together 2 6-bit values. 
// Note that the ordering of full adders starts with the *least* significant bit.
// 6'b100111+6'b100111
pred example1 {
    // Because these rely on the previous, each is a separate "let"
    let fa0 = RCA.firstAdder | 
    let fa1 = RCA.nextAdder[fa0] | 
    let fa2 = RCA.nextAdder[fa1] | 
    let fa3 = RCA.nextAdder[fa2] | 
    let fa4 = RCA.nextAdder[fa3] | 
    let fa5 = RCA.nextAdder[fa4] | {
        fa0.a=True
        fa0.b=True
        fa1.a=True
        fa1.b=True
        fa2.a=True
        fa2.b=True
        fa3.a=False
        fa3.b=False
        fa4.a=False
        fa4.b=False
        fa5.a=True
        fa5.b=True
    }
}

// Run, using 6 full adders (one for each bit of input)
run {rca example1} for 1 RCA, exactly 6 FA


