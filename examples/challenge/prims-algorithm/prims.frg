#lang forge/temporal

-- Default of 5; this model uses 1 time index per state
option max_tracelength 7

/*
Prim's algorithm in Forge
  Tim, 2021; revised to use Temporal Forge in 2024

  For visualization, use Table View and open the "Time" side drawer to step
  through the trace; you should see a new Node being added to Prim.pnodes every step.
  
  Note that this model will take around a minute to run. Some of the 
  (passing) tests are somewhat inefficient.

*/

-------------------------------------------------------------
-- Always have a specific weighted directed graph in the background
-------------------------------------------------------------

sig Node {
    edges: set Node -> Int
}

pred wellformedgraph {
    -- no differently-valued edges between the same nodes
    all n, m: Node | lone edges[n][m] 
    
    -- no negative weights
    all n, m: Node | some edges[n][m] implies edges[n][m] >= 0 
    
    -- This isn't strong enough (it says: symmetric, **without** regard to weights):
    -- edges.Int = ~(edges.Int)
    -- This is strong enough (symmetric, with same weights required):
    all n, m: Node | edges[n][m] = edges[m][n]

    -- no self-loops
    no (iden & edges.Int)

    -- connected (or else it cannot be spanned)
    all disj n, m: Node | n in m.^(edges.Int)
}

-- Demo checking that the weight-aware symmetry constraint subsumes the other.
pred test_old { edges.Int = ~(edges.Int) }
pred test_new { all n, m: Node | edges[n][m] = edges[m][n] }
assert test_new is sufficient for test_old for 5 Node, 5 Int

-------------------------------------------------------------
-- Prim's algorithm
-------------------------------------------------------------

one sig Prim {
    var pnodes: set Node,
    var ptree: set Node->Node
}

pred prim_init {
    one Prim.pnodes -- one arbitrary node picked to start
    no Prim.ptree   -- no spanning tree edges yet
}

-- Intermediate steps represented as helper predicates

-- The set of possible nodes to expand the tree to next, along with costs
fun candidatesWithWeights: set Node -> Int { 
    ((Node-Prim.pnodes) -> Int) & Prim.pnodes.edges
}
-- The cheapest cost among all candidates
fun minCandidateWeight: set Int { 
    min[candidatesWithWeights[Node]]
}
-- The candidates who share that cheapest cost
-- (Note how you can use a helper function as a relation to join on!)
fun minWeightCandidates: set Node {
  candidatesWithWeights.minCandidateWeight 
}

-- A little code duplication here, but it enables a richer validation below
pred prim_step_enabled[m, n: Node] {
    m in Prim.pnodes             -- source node is in the set
    n in minWeightCandidates     -- destination node is a minimal hop away
    -- perhaps there's a more efficient way to do this line?
    m->n->minCandidateWeight in edges  -- there's an actual edge at this weight
}
pred prim_step[m, n: Node] {
    -- GUARD
    prim_step_enabled[m, n]
    -- ACTION/FRAME for pnodes
    Prim.pnodes' = Prim.pnodes + n 
    -- ACTION/FRAME for ptree (remember to add both symmetric edges!)
    Prim.ptree' = Prim.ptree + (m -> n) + (n -> m)
}

pred prim_doNothing {
    -- GUARD
    -- we cannot make progress using a Prim step -- DO NOT CONFUSE this with prim_step
    all m_no, n_no: Node | not prim_step_enabled[m_no, n_no]
    -- ACTION
    Prim.pnodes' = Prim.pnodes
    Prim.ptree' = Prim.ptree
}


-----------------------------------------------
-- Run!
-----------------------------------------------

pred prim_trace {
    wellformedgraph  -- require a well-formed graph
    prim_init        -- start in an initial state
    
    -- always step forward using these transitions
    always { 
        some m, n: Node | { prim_step[m, n] }
        or 
        prim_doNothing 
    }
}

-------------------------------------------------------------
-- View a run!
-------------------------------------------------------------

run prim_trace for exactly 5 Node, 5 Int
