#lang forge

option run_sterling "gc.cnd"


abstract sig Memory {}
one sig Root extends Memory {}
sig HeapCell extends Memory {
    next: lone Memory
}

-- Determines whether a cell is reachable from the root at a given state
pred reachFromRoot[m : HeapCell, s : State] {
    Root->m in ^(s.references)
}

---------- States ----------

abstract sig State {
    -- Every state has some allocated cells and references between any cells
    allocated : set HeapCell,
    references : set Memory->HeapCell
}

one sig Initial extends State {}
one sig Changed extends State {}
one sig Marked extends State {
    marked: set HeapCell
}
one sig Swept extends State {}

pred InitialToChanged {
    -- Fill me in!
    -- What are the constraints between the initial and changed states?
    Initial.allocated in Changed.allocated
    all cell : HeapCell |
        reachFromRoot[cell, Changed] implies (cell in Changed.allocated)
}

pred ChangedToMarked {
    -- Fill me in!
    -- What are the constraints between the changed and marked states?
    Marked.marked = (^(Changed.references))[Root]
    Changed.allocated = Marked.allocated
    Changed.references = Marked.references
}

pred MarkedToSwept {
    -- Fill me in!
    -- What are the constraints between the marked and swept states?
    Marked.references = Swept.references
    Swept.allocated = Marked.marked
}

pred MarkAndSweep {
    InitialToChanged
    ChangedToMarked
    MarkedToSwept
}

// Need one for MarkAndSweep
m1: run {MarkAndSweep} 

---------- Checks ----------

pred safe[s : State] {
    -- Everything reachable from the root is allocated
    all m : HeapCell | reachFromRoot[m, s] => (m in s.allocated)
}

pred clean[s : State] {
    -- Everything allocated is reachable from the root
    all m : HeapCell | (m in s.allocated) => reachFromRoot[m, s]
}

test expect {
    // soundness : {MarkAndSweep implies (safe[Initial] implies safe[Swept])} is unsat
    //completeness : {MarkAndSweep implies (clean[Initial] implies clean[Swept])} is checked
    //completeness2 : {(clean[Initial] and MarkAndSweep) implies not clean[Swept]} is unsat
}

------- Fragmentation -------



pred heapStructure {
    some HeapCell implies (some start: HeapCell | {
        no next.start
        start->(HeapCell - start) in ^next
    }) and (some end: HeapCell | {
        no end.next
    })
}




pred fragmented[s : State] {
    -- there is some allocated heapcell
    some a: HeapCell | {
        a in s.allocated
        -- with an unallocated cell before it
        some unBefore: HeapCell {
            unBefore not in s.allocated
            unBefore.next = a
        }
        -- and an unallocated cell after it
        some unAfter: HeapCell {
            unAfter not in s.allocated
            unAfter in a.^next
        }
    }
}

m2: run {MarkAndSweep and heapStructure and fragmented[Initial]}

-- racket gc.frg -O sterling_port 17100
-- then open http://localhost:8081?17100 in a web browser