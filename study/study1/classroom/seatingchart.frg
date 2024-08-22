#lang forge


sig Row {
    behind : lone Row
}

sig Table {
    right : lone Table,
    row : one Row
}

sig Student {
    seatedAt : one Table
}

one sig Magoo extends Student {}


pred rowLayout {

    // behind is linear
    one r : Row | Row in r.*behind
    one top : Row | no top.behind
    all r : Row |r not in r.^behind


    all r : Row | some t : Table | (t.row = r)

}



pred tableLayout {
    all t : Table | {
        t not in t.^right // The tables are in a line
        all tr : t.^right | tr.row = t.row // The tables are in the same row


        // In the tables row, there is one table that has no right neighbor

        one endTable : Table | {
            endTable.row = t.row
            no endTable.right
        }


        // There is one table for whom everyone is the right neighbor
        one startTable : Table | {
            startTable.row = t.row
            no right.startTable
            t in startTable.*right
        }
    }
}


pred minfront {
    // Magoo should be seated on a table in the first row
    one t : Table | {
        Magoo.seatedAt = t
       
        no behind.(t.row)
    }
}



pred wellformed {
    rowLayout
    tableLayout
}


run {
    wellformed
        not minfront
} for exactly 5 Table, exactly 3 Row