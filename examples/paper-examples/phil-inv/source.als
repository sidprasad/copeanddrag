open util/graph[Philosopher]
open util/ordering[State] as so
open util/ordering[Philosopher] as po

-- a philosopher has a fork and another philosopher on either side
sig Philosopher {
  disj leftFork, rightFork: one Fork,
  disj leftPhil, rightPhil: one Philosopher
}

-- a fork
sig Fork {}

-- at every state, a fork can be in use by a single philosopher
sig State {
  using: Fork -> lone Philosopher
}

-- if a philospher is using a fork, it must be one of the two next to them
fact {
  all s: State |
    all p: Philosopher |
      let fork = using[s].p | fork in p.(leftFork + rightFork)
}

-- a predicate that describes the initial table setting
pred setTheTable {
  //#Fork = #Philosopher
  stronglyConnected[leftPhil]
  ring[leftPhil]
  leftPhil = ~rightPhil



  all p: Philosopher {
    p.leftPhil.rightFork = p.leftFork
    p.rightPhil.leftFork = p.rightFork
  }
  //Fork in Philosopher.leftFork
  //Fork in Philosopher.rightFork
  all f: Fork {
    lone p: Philosopher | p.leftFork = f
    lone p: Philosopher | p.rightFork = f
  }
  no using[so/first] -- all forks are initially on the table
  po/next in rightPhil -- order the philosophers, just to cut down on the number of instances
}

-- the fork is available
pred available [s: State, f: Fork] {
  f not in using[s].Philosopher
}

-- the philosopher is eating
pred eating [s: State, p: Philosopher] {
  using[s].p = { p.leftFork + p.rightFork }
}

-- the philosopher is thinking
pred thinking [s: State, p: Philosopher ] {
  no using[s].p
}

-- the philosopher can participate in the dinner party
pred canParty [s: State, p: Philosopher] {
  eating[s, p] or available[s, p.leftFork] or available[s, p.rightFork]
}

-- the philosopher takes their left fork
pred takeLeft [s, ss: State, p: Philosopher] {
  let fork = p.leftFork {
    available[s, fork]
-- using[ss][fork] = p  -- this was an easy bug to find with the vis... philosopher immediately takes two forks
    using[ss].p = using[s].p + fork
  }
}

-- the philosopher takes their right fork
pred takeRight [s, ss: State, p: Philosopher] {
  let fork = p.rightFork {
    available[s, fork]
-- using[ss][fork] = p
    using[ss].p = using[s].p + fork
  }
}

-- the philosopher puts down their forks
pred release [s, ss: State, p: Philosopher] {
  eating[s, p]
  thinking[ss, p]
}

-- the philosopher waits a tick
pred wait [s, ss: State, p: Philosopher] {
  using[s].p = using[ss].p
}

-- the philosopher participates in the dinner party
pred party [s, ss: State, p: Philosopher] {
  release[s, ss, p] or takeLeft[s, ss, p] or takeRight[s, ss, p] or wait[s, ss, p]
}

-- a dinner party in which philosophers aren't greedy
pred dinnerParty {
  setTheTable
  all s: State, ss: so/next[s] {
    all p: Philosopher {
      party[s, ss, p]
    }
  }
}


run dinnerParty for 5 Philosopher, exactly 6 Fork, exactly 7 State

