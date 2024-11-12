#lang forge/bsl

sig State {}
one sig Election {
   firstState: one State,
   next: pfunc State -> State
}
sig Process {   
   ID: one Int,
   successor: one Process,
   -- the highest ID seen so far at each State index
   --   this tells us which ID to send to the  
   --   successor at each State
   highestSeenID: pfunc State -> Int
}

//run {} for 3 Process, 4 State for {next is linear}



pred wellformed {
   -- every process can reach every process via successor
   -- Assumption: (successor is linear)
   all p1, p2: Process | reachable[p2,p1,successor]

   -- Every process has a nonzero ID
   all p: Process | p.ID > 0

   -- Every process has a different ID
   all p1, p2: Process | (p1 != p2) iff p1.ID != p2.ID
}

//run {wellformed} for exactly 3 Process, 4 State for {next is linear}



-- In the initial state, each process sends its own ID
pred init [t: State] {
    -- [FILL]
    all p: Process | p.highestSeenID[t] = p.ID
}

-- A process has won when all processes have its ID. But how does it learn this?
-- A process "knows" it has won when it *receives* its own ID.
pred winningAfter [t: State, p: Process] {
    -- [FILL]
    some prev: Process | {
        prev.successor = p
        prev.highestSeenID[t] = p.ID
    }
}

-- a transition step taken from time <t1> to time <t2>
-- You may find it convenient to use an if-then-else expression here:
--  e.g., {some Tim.madeTea[Today] => Tim.favoriteTea else Water}
--   evaluates to Tim's favorite tea *if* Tim made tea today. Otherwise,
--   it evaluates to water.
-- In this simple model, it’s all about constraining the toSend field.
-- Think about how a process decides which is its highestSeenID in the next
--  state according to the current state. You may find it helpful to use <let>
--  to assign names to temporary variables. e.g., let teaToday = Tim.madeTea[Today] | 
--  (don't forget the "such that" vertical bar after the let definition)
pred step[t1, t2: State] {
    -- [FILL]
    all prev: Process {
        let predID = prev.highestSeenID[t1] | 
        let curID = prev.successor.highestSeenID[t1] | 

        predID >= curID => {
            prev.successor.highestSeenID[t2] = predID
        } else {
            prev.successor.highestSeenID[t2] = curID
        }
    }
}

-- Nothing for you to do here, but note these constraints to help guide 
-- you as you complete the above [FILL]s.
pred traces {
    wellformed -- require a well formed process ring
    init [Election.firstState] -- require a good starting state
    no prev : State | Election.next[prev] = Election.firstState -- first state doesn't have a predecessor
    
    -- all state transitions should satisfy step
    all t: State |
        some Election.next[t] implies
            step [t, Election.next[t]]
}

-- Show a trace where somebody wins. Try to get a trace that's non-trivial.
pred show {
   traces
   some p: Process, t: State | winningAfter[t, p]
   -- (don’t let Forge give you a 1-process ring!)
   -- [FILL]
   #Process > 1
}

// Datum based on this
run show for 3 Process, 5 State for { next is linear }



-- (We'll learn a nicer way to say this sort of thing later.)
pred winningIsForever {
    traces implies {
        -- Given <traces>, when a process wins it stays the winner
        -- What does it mean to stay the winner? Think about every process's highestSeenID
	    -- [FILL]
        all p: Process, t: State | winningAfter[t, p] => {
            all afterT: State | reachable[afterT, t, Election.next] => {
                p.highestSeenID[afterT] = p.highestSeenID[t]
            }
        }
    }
}

pred eventuallyElectionEnds {
    traces implies {
	    -- Given <traces>, some process will always eventually win.
	    -- [FILL]
        some p: Process, t: State | winningAfter[t, p]
    }
}

