#lang forge

sig Station {
    north : lone Station,
    east : lone Station,
    next : set Station
}



pred stationLayout {

    all s : Station | {
        
        (some s.north and some s.east) implies ((s.north).east = (s.east).north)
        // I *think* this makes it a grid
        (some s.east) implies (some s.north) implies (some s.east.north)

        // Up to one station has s to the north / east
        lone (north.s)
        lone (east.s)


        // You cannot have the same station to the north and east
        (s.north = s.east) implies (no s.north)




    }

    no (iden & ^north)
    no (iden & ^east)

    no (iden & ^(north + east))

    // Connectedness?
    //Station in s.*north + s.*east + s.*(~north) + s.*(~east)
            
    one s : Station | no s.north and no s.east
    one s : Station | (no north.s) and (no east.s)
}


pred subwayMap {
    stationLayout


    no (iden & next)
    no (next & ~next)
    all s : Station | lone s.next

}

pred canReach[from : Station, to : Station] {
    from in to.^next
}



pred rome[r : Station] {
    all s : Station - r | {
        //canReach[s, r]
        canReach[r, s]
    }
}


run {
    subwayMap 
    
    one h : Station | rome[h]
    some north
    some east

} for exactly 6 Station