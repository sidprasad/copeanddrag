#lang forge

sig Node {
    t: lone Node, 
    f: lone Node,
    v: lone Variable
}

abstract sig Leaf extends Node {}
one sig True, False extends Leaf {}

sig Variable {}


fun descendantsOf[ancestor: Node]: set Node {
  ancestor.^(t + f) -- nodes reachable via transitive closure
}

fun ancestorsOf[descendant: Node]: set Node {
  ^(t + f).(descendant) -- nodes reachable via transitive closure
}

pred dag {

  all n: Node | n not in descendantsOf[n] 
  -- connected via finite chain of t, f, and inverses
  all disj n1, n2: Node | n1 in n2.^(t + f + ~t + ~f)
}

pred trueFalseLeaves {

    all n : Node | {
        
        (n in Leaf) iff {
            no n.t
            no n.f
            no n.v
        }


        (some n.t) iff (some n.v)
        (some n.f) iff (some n.v)
        (some n.t) iff (some n.f)
    }
}

pred rootedDAG {
    dag 
    one n : Node | no (t + f).n
}


pred bdd {
    Node.v = Variable
  rootedDAG
  trueFalseLeaves

  all n : Node - Leaf | {
    one n.v
    one n.t
    one n.f
  }


  all n : Node | (some n.t) iff (some n.f)




 // There is an order of variables

    all n : Node - Leaf | {



        no d : descendantsOf[n] | (d.v) = (n.v)   // Effectively the same though
        no a : ancestorsOf[n] | (a.v) = (n.v)

        // Also no 

        n.t != n.f
    }
}


run {
  bdd

 } for exactly 3 Variable, exactly 7 Node, exactly 2 Leaf

