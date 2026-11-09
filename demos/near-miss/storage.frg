#lang forge
sig Replica {}
sig Disk { copies: set Replica }
pred allStored { all r: Replica | some copies.r }
pred separated { all d: Disk | lone d.copies }
placement: run { allStored separated } for exactly 3 Replica, exactly 2 Disk
