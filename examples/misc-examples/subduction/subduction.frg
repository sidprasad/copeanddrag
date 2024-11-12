/* ====================================================================
A STATIC MODEL OF NETWORKS, BRIDGING, AND LAYERING
   Simplifying assumptions, permanent:  
    * This is a model of static network states and their properties.
    * Every member of a network has a unique name in that network, and
      unique names are conflated with members.
    * Component failures are not modeled; if a component has failed, it
      does not exist in the network state.
   Simplifying assumptions, temporary:  
    * A machine can have no more than one member in a network (at least
      when layering is involved).
    * There is no representation of blocking or middlebox requirements
      (including reverse-path middleboxes).
    * There are no compound sessions.
==================================================================== */
/* --------------------------------------------------------------------
TYPES
-------------------------------------------------------------------- */
#lang forge

sig NetworkName { } one sig Service extends NetworkName { }
   
sig SessionIdent { }
   
sig LinkIdent { }
 
sig Name { }
   
one sig Receive, Forward, Self, Primitive, Drop { }

abstract sig Protocol { }
one sig OneWay, TwoWay, AllCast, AnyCast extends Protocol { }
 
sig Header 
   {  src, dst: Name,
      sessionIdent: SessionIdent, 
      protocol: Protocol, 
      overlay: lone NetworkName 
   }
fact HeadersAreRecords { all h, h1: Header |
   (  h.sessionIdent = h1.sessionIdent && h.overlay = h1.overlay
   && h.src = h1.src && h.dst = h1.dst && h.protocol = h1.protocol  ) 
   => h = h1 }
pred ReverseHeader [h, h1: Header] {
      h.src = h1.dst && h.dst = h1.src && h.protocol = h1.protocol
   && h.sessionIdent = h1.sessionIdent && h.overlay = h1.overlay }

sig Link { 
   sndr: Name, 
   sndrIdent: LinkIdent,
   rcvrs: some Name,
   rcvrIdents: rcvrs -> one LinkIdent
 }
-- For computation of reachability, a link must be directional.  So a
-- "link" represented in the model is actually a link plus direction.
-- More specifically, a link with multiple senders (a two-way point-to
-- point link or group link) must be represented by a set of links, one
-- for each sender.
fact LinksAreRecords {  all k, k1: Link - GroupLink |
   (  k.sndr = k1.sndr && k.sndrIdent = k1.sndrIdent
   && k.rcvrs = k1.rcvrs && k.rcvrIdents = k1.rcvrIdents  ) => k = k1 }  
pred ReverseLink [k, k1: Link - GroupLink] {
      k.sndr = k1.rcvrs && k.sndrIdent = (k1.rcvrs).(k1.rcvrIdents)
   && k.rcvrs = k1.sndr && (k.rcvrs).(k.rcvrIdents) = k1.sndrIdent  }
sig GroupLink extends Link {  group: Name  }



fact GroupLinksAreRecords {  all k, k1: GroupLink |
   (  k.sndr = k1.sndr && k.sndrIdent = k1.sndrIdent
   && k.rcvrs = k1.rcvrs && k.rcvrIdents = k1.rcvrIdents
   && k.group = k1.group                               ) => k = k1  }
   
sig ExternalReference { exNet: NetworkName }
sig ExternalLink extends ExternalReference { exLink: LinkIdent }
sig ExternalSession extends ExternalReference {exSession: SessionIdent}
 
sig AcquireTable { arows: LinkIdent -> Header -> (Receive + Forward) }

sig ForwardTable { 
   frows: (LinkIdent + Self) -> Header -> (LinkIdent + Drop) }

/* --------------------------------------------------------------------
NETWORKS
-------------------------------------------------------------------- */

-- All networks have unique names.
fact { net in NetworkState lone -> NetworkName }
   
sig NetworkState {
-- Network topology.
   net: NetworkName,
   members: set Name,        -- every member has at least a unique name
   disj infras, users: set members,    -- trusted and untrusted members
   groups: set Name - members,                           -- group names
   disj allGroups, anyGroups: set groups,
   groupSenders: groups -> Name,
   groupReceivers: groups -> Name,
   links: set Link,
   disj oneLinks, twoLinks, groupLinks: set links,
   outLinks: members -> LinkIdent -> links,                  -- derived
   inLinks: members -> LinkIdent -> links,                   -- derived
-- Network traffic.
   sendTable: members -> SessionIdent -> Header,
   receiveTable: 
      members -> Header -> (Primitive + ExternalLink),
   effectiveSend: members -> Header -> LinkIdent,            -- derived
   effectiveReceive: members -> Header -> LinkIdent,         -- derived
   reasonableOneHeaders, reasonableTwoHeaders,               -- derived
      reasonableGroupHeaders: set Header,                    -- derived
-- Behavior of network members.
   acquireTables: members -> lone AcquireTable,
   forwardTables: members -> lone ForwardTable,
   transmitTable: 
      members -> LinkIdent -> (Primitive + ExternalSession),
   oneHop: Header -> links -> links,                         -- derived
   reachable: Header -> members -> members,                  -- derived
   effectivelyReachable: Header -> members -> members        -- derived
}  {
-- Network topology.
   -- Each member is an infrastructure member or user.
      infras + users = members
   -- Each group is one of two types.
      groups = allGroups + anyGroups
   -- Consistency of group members.  Broadcast and multicast groups are
   -- conflated as AllCast groups because the only difference is that,
   -- for broadcast groups, the senders are exactly the same as the
   -- receivers.
      all g: allGroups | (some g.groupSenders && #g.groupReceivers>1)
      all g: anyGroups | 
      (  no (g.groupSenders & g.groupReceivers) && some g.groupSenders
      && # g.groupReceivers > 1                                      )
   -- Each link is one of three types.
      links = oneLinks + twoLinks + groupLinks
   -- Point-to-point link fields have the right types, cover twoLinks.
      all k: oneLinks + twoLinks |
         (  k in Link - GroupLink && one k.rcvrs
         && some ((k.sndr + k.rcvrs) & members)
         && no ((k.sndr + k.rcvrs) & groups)  )
      all k: twoLinks | some k1: twoLinks - k | ReverseLink [k, k1]
   -- Group links have the right types.
      groupLinks in GroupLink
   -- Correctness of group links.  Group links cannot be bridging 
   -- links.  
      -- A group link1s sender and receivers match group and network
      -- membership.
      all k: groupLinks | let g = k.group | 
      (  g in groups && g.(groupSenders + groupReceivers) in members 
      && k.sndr in g.groupSenders
      && k.rcvrs = g.groupReceivers - k.sndr  )
      -- Across a group1s links, all linkIdents are consistent.
      all g: groups |
      let pairs = { m: members, i: LinkIdent | 
                     some k: (links <: group).g |
                        (k.sndr = m && k.sndrIdent = i)
                     || (m in k.rcvrs && i = m.(k.rcvrIdents)) } |
      (  all m: g.groupSenders + g.groupReceivers | lone m.pairs   )
      -- Completeness of group links: if one part of group
      -- communication is implemented as a link, then all must be.
      all g: groups | 
         (some (links <: group).g) =>
      (  all m: g.groupSenders | some k: groupLinks |
            k.group = g && k.sndr = m               )
   -- For each member, its local linkIdents are disjoint, except for
   -- reversing pairs and group links.
      all disj k0, k1: links | 
         (k0.sndr = k1.sndr => k0.sndrIdent != k1.sndrIdent)
      all disj k0, k1: oneLinks + twoLinks |
      (  (k0.rcvrs = k1.rcvrs =>
            (k0.rcvrs).(k0.rcvrIdents) != (k1.rcvrs).(k1.rcvrIdents))
      && (k0.sndr = k1.rcvrs => 
            (  k0.sndrIdent != (k1.rcvrs).(k1.rcvrIdents) 
            || (k0 + k1 in twoLinks && ReverseLink [k0, k1])  )  )  )
      all disj k0, k1: groupLinks |
         (some (k0.rcvrs & k1.rcvrs) => k0.group = k1.group)
      all k0: oneLinks + twoLinks, k1: groupLinks |
         no (k0.rcvrIdents & k1.rcvrIdents)
   -- Derivation of inLinks and outLinks.
      outLinks = { m: members, i: LinkIdent, k: links |
         k.sndr = m && k.sndrIdent = i                }         
      inLinks = { m: members, i: LinkIdent, k: links |
         (m -> i) in k.rcvrIdents                    }
-- Network traffic.  This models the traffic that members are expected
-- to send and receive, and it is optional.  Note that infrastructure 
-- members can send and receive.
-- The "reasonable" header sets point out headers that are being used
-- responsibly: they are grouped into well-structured sessions, and 
-- they are sent and received by the right members within the network.
-- Predicates and assertions can use these sets to distinguish traffic
-- that should be transported (requirements) from possibly erroneous or 
-- malicious traffic (threat model).
   -- Consistency of the sendTable, which is always deterministic.
      all s: SessionIdent, h: s.(members.sendTable) | 
         one h && h.sessionIdent = s
   -- Consistency of the receiveTable.
      all x: ExternalLink | 
         x in Header.(members.receiveTable) => x.exNet != net 
   -- Determinism of the receiveTable.
      all m: members, h: Header | lone h.(m.receiveTable)
   -- Derivation of effectiveSend.  If a send is effective, it is
   -- supported by an entry in the member1s forwardTable.
      effectiveSend = { m: members, h: Header, ki: LinkIdent |
            (m -> h.sessionIdent -> h) in sendTable
         && (h -> ki) in Self.((m.forwardTables).frows) }
   -- Derivation of effectiveReceive.  If a receive is effective, it is
   -- supported by an entry in the member1s acquireTable.
      effectiveReceive = { m: members, h: Header, ki: LinkIdent |
         (m -> h) in receiveTable.(Primitive+ExternalLink) 
      && (ki -> h -> Receive) in (m.acquireTables).arows              } 
   -- Derivation of sets of reasonable headers in the traffic model.
      let headers = SessionIdent.(members.sendTable) 
                    + members.receiveTable.(Primitive+ExternalLink) | {
      reasonableOneHeaders = { h: headers | let s = h.sessionIdent |
            one (sessionIdent.s & headers)
         && h.protocol = OneWay                                    
         && (effectiveSend.LinkIdent).h = h.src
         && (effectiveReceive.LinkIdent).h = h.dst                 }
      reasonableTwoHeaders = { h: headers | let s = h.sessionIdent |
         some h1: headers - h |
            sessionIdent.s = (h + h1)
         && ReverseHeader [h, h1] && h.src != h.dst -- no self-sessions
         && h.protocol = TwoWay
         && (effectiveSend.LinkIdent).h = h.src
         && (effectiveSend.LinkIdent).h1 = h1.src
         && (effectiveReceive.LinkIdent).h = h.dst           
         && (effectiveReceive.LinkIdent).h1 = h1.dst                  }
      reasonableGroupHeaders = { h: headers | 
         let s = h.sessionIdent | let hs = sessionIdent.s - h |
            one (h + hs).dst && h.dst in groups
         && h.src in (h.dst).(groupSenders)
         && one (h + hs).protocol && lone (h + hs).overlay
         && h.protocol ! in (OneWay + TwoWay)
         && (h.protocol = AllCast => h.dst in allGroups)
         && (h.protocol = AnyCast => h.dst in anyGroups)
         && (effectiveSend.LinkIdent).h = h.src
         && (effectiveReceive.LinkIdent).h = 
               (h.dst).groupReceivers - h.src                 }       }  
-- Behavior of network members.  Acquire and forward tables have to be
-- modeled differently because they have too many columns for Alloy.
   -- Consistency of the acquireTable:  all inLinks are real.
      all m: members | 
         (((m.acquireTables).arows).(Receive+Forward)).Header
      in (m.inLinks).links
      -- An acquireTable can be nondeterministic, because, to implement
      -- broadcast and multicast service, a member may have to both
      -- receive and forward a packet.  If there is no matching entry
      -- for an incoming packet, it is dropped.
   -- Consistency of the forwardTable.  
      -- All inLinks and outLinks are real.
      all m: members, kin: 
         (((m.forwardTables).frows).(LinkIdent + Drop)).Header |
         ( (m -> kin) in inLinks.links || kin = Self )
      all m: members, kout:
          Header.((LinkIdent + Self).((m.forwardTables).frows)) |
      kout != Drop => (m -> kout) in outLinks.links
      -- Because nondeterminism means replication, the table cannot
      -- offer a nondeterministic choice between Drop and an outLink.
      all m: members, kin: (LinkIdent + Self), h: Header,
         disj kout, kout1: (LinkIdent + Drop) |
         (kin->h->kout) + (kin->h-> kout1) in (m.forwardTables).frows
         => (kout + kout1) in LinkIdent
   -- Completeness and consistency of transmitTable.  
      -- transmitTable is complete.
         transmitTable.(Primitive+ExternalSession) = outLinks.links 
      -- transmitTable is deterministic, because a link has only one
      -- embodiment.
         all m: members, ki: LinkIdent | lone ki.(m.transmitTable)
      -- External sessions are really external.
         all x: ExternalSession | 
            x in LinkIdent.(members.transmitTable) => x.exNet != net 
      -- Links in a reversing pair must have the same embodiment.
         all m, m1: members, ki, ki1: LinkIdent, k, k1: Link |
         (  (m -> ki -> k) + (m1 -> ki1 -> k1) in outLinks
         && ReverseLink [k, k1]                          )
         => ki.(m.transmitTable) = ki1.(m1.transmitTable)
      -- Links in a group must all have the same embodiment.
         all m, m1: members, ki, ki1: LinkIdent, k, k1: GroupLink |
         (  (m -> ki -> k) + (m1 -> ki1 -> k1) in outLinks
         && k.group = k1.group                           )
         => ki.(m.transmitTable) = ki1.(m1.transmitTable)
-- Reachability.
-- 1) (h -> m -> m1) in reachable means that if a packet with header h
--    is emitted by member m (sent or forwarded), then the packet will 
--    reach member m1 through a path all of whose internal members (if
--    any) are infrastructure members.  
-- 2) Some additional details about group communication, etc.: 
--     * If a packet is sent through an AllLink, then the packet is 
--       delivered to all receivers.  The basic semantics above hold.
--     * If a packet is sent through an anyLink, it is delivered to 
--       only one receiver.  This is an exception to the above
--       semantics, and means that only safety properties can be
--       verified with it.
--     * If a member1s forwarding table is nondeterministic, the 
--       packet is replicated and sent to all outgoing links.  As with
--       broadLinks and multiLinks, the basic semantics above hold.
-- 3) Reachability is completely independent of the traffic model.
-- 4) The transmitTable is not mentioned because we already know that
--    it is consistent, complete, and deterministic.  Reachability 
--    assumes live and correct link implementations.
-- 5) Because only forwarding in infrastructure members can contribute
--    to reachability, in a peer-to-peer network with forwarding, all
--    peers must be infras.
      oneHop = {  h: Header, disj k, k1: links |
         some f: infras, ki, ki1: LinkIdent |
            (f -> ki -> k) in inLinks && (f -> ki1 -> k1) in outLinks
         && (ki -> h -> Forward) in (f.acquireTables).arows
         && (ki -> h -> ki1) in (f.forwardTables).frows             }
      reachable = {  h: Header, m, m1: members | 
         some k, k1: links | 
            m = k.sndr && m1 in k1.rcvrs
         && (  k = k1 || (k -> k1) in ^(h.oneHop)  )  }
-- Effective reachability is a form of reachability that includes the
-- traffic model, i.e., the intentions and cooperation of the senders
-- and receivers.
      effectivelyReachable = {  h: Header, m, m1: members | 
         some k, k1: links, kout, kin: LinkIdent | 
            (m -> h -> kout) in effectiveSend
         && (m -> kout -> k) in outLinks
         && (m1 -> h -> kin) in effectiveReceive
         && (m1 -> kin -> k1) in inLinks
         && (  k = k1 || (k -> k1) in ^(h.oneHop)  )      }
}

/* --------------------------------------------------------------------
PROPERTIES OF NETWORK TOPOLOGIES 
-------------------------------------------------------------------- */ 

pred Fully_oneLink_connected [n: NetworkState] {
-- A network in which there is a one-way link from each member to each
-- other member.  It does not matter whether the members are infras or
-- users, because no forwarding is necessary.
   all disj m, m1: n.members | some k: n.oneLinks |
      k.sndr = m && k.rcvrs = m1                  }

pred Fully_twoLink_connected [n: NetworkState] {
-- A network in which there is a direct two-way link between each pair 
-- of members.  It does not matter whether the members are infras or
-- users, because no forwarding is necessary.
   all disj m, m1: n.members | some k: n.twoLinks |
      k.sndr = m && k.rcvrs = m1                  }

pred Fully_broadcast_connected [n: NetworkState] {
-- A network in which there is a broadcast group, implemented by links,
-- including all members.
   some g: n.allGroups | 
      g.(n.groupSenders) =n.members && g.(n.groupReceivers) =n.members 
   && (some k: n.groupLinks | k.group = g)                           }

pred No_self_links [n: NetworkState] {--only oneLinks can be self-links
   all k: n.oneLinks | k.sndr != k.rcvrs }

/* --------------------------------------------------------------------
PROPERTIES OF NETWORK TRAFFIC
-------------------------------------------------------------------- */

pred Fully_oneSession_active [n: NetworkState] {
-- A network with a one-way session from each member to each other 
-- member.
   all disj m, m1: n.members | some h: Header |
      h.src = m 
   && (m -> h) in (n.effectiveSend).LinkIdent
   && h.dst = m1 
   && (m1 -> h) in (n.effectiveReceive).LinkIdent  }

pred Users_fully_oneSession_active [n: NetworkState] {
-- A network with a one-way session from each user member to each other 
-- user member.
   all disj m, m1: n.users | some h: Header |
      h.src = m 
   && (m -> h) in (n.effectiveSend).LinkIdent
   && h.dst = m1 
   && (m1 -> h) in (n.effectiveReceive).LinkIdent  }

pred Fully_twoSession_active [n: NetworkState] {
-- A network with a two-way session between each pair of members.
   all disj m, m1: n.members | some h, h1: Header |
   (  ReverseHeader [h, h1]
   && h.src = m && h.dst = m1
   && (m -> h) in (n.effectiveSend).LinkIdent
   && (m1 -> h1) in (n.effectiveSend).LinkIdent
   && (m1 -> h) in (n.effectiveReceive).LinkIdent 
   && (m -> h1) in (n.effectiveReceive).LinkIdent  )  }

pred Users_fully_twoSession_active [n: NetworkState] {
-- A network with a two-way session between each pair of user members.
   all disj m, m1: n.users | some h, h1: Header |
   (  ReverseHeader [h, h1]
   && h.src = m && h.dst = m1
   && (m -> h) in (n.effectiveSend).LinkIdent
   && (m1 -> h1) in (n.effectiveSend).LinkIdent
   && (m1 -> h) in (n.effectiveReceive).LinkIdent 
   && (m -> h1) in (n.effectiveReceive).LinkIdent  )  }

pred Fully_broadcast_active [n: NetworkState] {
-- A network with a broadcast session from each member.
   some g: n.allGroups | 
      g.(n.groupSenders) =n.members && g.(n.groupReceivers) =n.members 
   && (all m: g.(n.groupSenders) | some h: Header |
         h.src = m && h.dst = g && h.protocol = AllCast 
      && (m -> h) in (n.effectiveSend).LinkIdent
      && all m1: g.(n.groupReceivers) |
            (m1 -> h) in (n.effectiveReceive).LinkIdent )            }

pred No_self_sessions [n: NetworkState] {
-- Enabling a member to have a session with itself is not required.
   all m: n.members | 
   no (m.(n.effectiveSend).LinkIdent&m.(n.effectiveReceive).LinkIdent)}

pred Header_sources_are_authentic [n: NetworkState] {
-- Subsumed by the "reasonable" sets, but may be used separately.
   all m: n.members, h: Header |
      (m -> h) in (n.effectiveSend).LinkIdent => h.src = m  }

/* --------------------------------------------------------------------
PROPERTIES OF NETWORK BEHAVIOR
-------------------------------------------------------------------- */

pred No_routing_loops [n: NetworkState] {
   all h: Header | no k: n.links | (k -> k) in ^(h.(n.oneHop)) }

pred Deterministic_forwarding [n: NetworkState] {
   all f: n.infras, ki: LinkIdent + Self, h: Header |
      lone h.(ki.((f.(n.forwardTables)).frows))     }

pred Network_satisfies_communication_demands [n: NetworkState] {
-- Communication demands are specified by the send and receive tables.
-- This is a liveness property.
   all m0, m1: n.members, h: Header |
   (  (m0 -> h) in (n.effectiveSend).LinkIdent
   && (m1 -> h) in (n.effectiveReceive).LinkIdent  )
   => (h -> m0 -> m1) in n.effectivelyReachable               }

pred Network_satisfies_reasonable_demands [n: NetworkState] {
-- Communication demands are specified by the send and receive tables.
-- This is a liveness property.
   all m0, m1: n.members, h: n.reasonableOneHeaders + 
                  n.reasonableTwoHeaders + n.reasonableGroupHeaders |
   (  (m0 -> h) in (n.effectiveSend).LinkIdent
   && (m1 -> h) in (n.effectiveReceive).LinkIdent  )
   => (h -> m0 -> m1) in n.effectivelyReachable      }

pred Effective_reachability_is_symmetric [n: NetworkState] {
   all h: Header, m, m1: n.members |
      (h -> m -> m1) in n.effectivelyReachable 
   => some h1: Header | ReverseHeader [h, h1]
      && (h1 -> m1 -> m) in n.effectivelyReachable         }

pred Only_authentic_traffic_delivered [n: NetworkState] {
   all m, m1: n.members, h: Header |
      (h -> m -> m1) in n.effectivelyReachable => h.src = m  }
  
/* --------------------------------------------------------------------
COMPOSITION OF NETWORKS BY BRIDGING
   We only define bridging on two networks.  The semantics of longer
bridging chains is given by the Bridging Equivalence Theorem.
-------------------------------------------------------------------- */

sig Bridge {
   disj left, right: NetworkState,
   reachableWithBridging: Header -> Name -> Name,            -- derived
   effectivelyReachableWithBridging: Header -> Name -> Name  -- derived 
}  {
   no left.members & right.members        -- name spaces cannot overlap   
   some (left.links & right.links)                    -- bridging links
   no ((left.links & right.links) & GroupLink)--no bridging with groups
   reachableWithBridging = 
   {  h: Header, m, m1: left.members + right.members | 
      some k, k1: left.links + right.links |
         m = k.sndr && m1 in k1.rcvrs
      && (k = k1 || (k -> k1) in ^(h.(left.oneHop + right.oneHop)))  }
   effectivelyReachableWithBridging = 
   {  h: Header, m, m1: left.members + right.members | 
      some k, k1: left.links + right.links, kout, kin: LinkIdent | 
         (m -> h -> kout) in left.effectiveSend + right.effectiveSend
      && (m -> kout -> k) in left.outLinks + right.outLinks
      && (m1 ->h ->kin) in left.effectiveReceive+right.effectiveReceive
      && (m1 -> kin -> k1) in left.inLinks + right.inLinks
      && (k = k1 || (k -> k1) in ^(h.(left.oneHop + right.oneHop)) )  }
}

assert Bridging_equivalence_theorem {
   all disj n0, n1, n2: NetworkState, b: Bridge | 
   {  b.left = n0 && b.right = n1
      n2.infras = n0.infras + n1.infras
      n2.users = n0.users + n1.users
      n2.allGroups = n0.allGroups + n1.allGroups
      n2.anyGroups = n0.anyGroups + n1.anyGroups
      n2.groupSenders = n1.groupSenders + n2.groupSenders
      n2.groupReceivers = n1.groupReceivers + n2.groupReceivers
      n2.oneLinks = n0.oneLinks + n1.oneLinks
      n2.twoLinks = n0.twoLinks + n1.twoLinks
      n2.groupLinks = n0.groupLinks + n1.groupLinks
      n2.sendTable = n0.sendTable + n1.sendTable
      n2.receiveTable = n0.receiveTable + n1.receiveTable
      n2.acquireTables = n0.acquireTables + n1.acquireTables
      n2.forwardTables = n0.forwardTables + n1.forwardTables
   }  => 
      (  n2.reachable = b.reachableWithBridging
      && n2.effectivelyReachable = b.effectivelyReachableWithBridging )
}
   
/* --------------------------------------------------------------------
COMPOSITION OF NETWORKS BY LAYERING
   The semantics of an overlay composed with an underlay is the same as
the semantics of the overlay, so there is no need for an equivalence
theorem.
   Because of the Bridging Equivalence Theorem, there is no difference
between layering a network on a single network or on a pair (or more)
of bridged networks.
   Subduction is a special situation that can arise when bridged
networks are layered on a network.  It is handled separately, so this
section covers only layering one network (equivalently a pair or more 
of bridged networks) on one network.
-------------------------------------------------------------------- */  

sig Layering { 
   disj over, under: NetworkName,
   disj overMembers, overAllGroups, overAnyGroups: set Name,
   attachments: Name lone -> lone Name,
   disj overOneLinks, overTwoLinks: set (Link - GroupLink),
   overGroupLinks: set GroupLink,
   implementations: Link -> lone SessionIdent
}  {
   attachments.Name = overMembers + overAllGroups + overAnyGroups
   implementations.SessionIdent = 
      overOneLinks + overTwoLinks + overGroupLinks
   -- OneLinks come as singles.
   all s: overOneLinks.implementations | one implementations.s 
   -- TwoLinks come in pairs.
   all s: overTwoLinks.implementations | 
      (  # implementations.s = 2
      && some disj k,k1: implementations.s | ReverseLink[k, k1])
   -- GroupLinks come in groups.
   all s: overGroupLinks.implementations | 
      (  # implementations.s >= 2
      && one (implementations.s).group  )
}

pred ValidOverlay [n: NetworkState, y: Layering] {
   y.over = n.net
-- Layering is consistent with overlay types.
   y.overMembers in n.members
   y.overAllGroups in n.allGroups && y.overAnyGroups in n.anyGroups
   y.overOneLinks in n.oneLinks && y.overTwoLinks in n.twoLinks
   y.overGroupLinks in n.groupLinks
-- Implemented links have attached endpoints.
   ((y.implementations).SessionIdent).(sndr + rcvrs) 
      in (y.attachments).Name
-- Implemented groups have attached groups.
   y.(overAllGroups + overAnyGroups) in (y.attachments).Name
-- The overlay transmit table invokes the implementations.
      all k: y.(overOneLinks + overTwoLinks + overGroupLinks), 
          s: k.(y.implementations) |
         let x = (k.sndrIdent).((k.sndr).(n.transmitTable)) |
            x in ExternalSession
         && x.exNet = y.under && x.exSession = s
}

pred ValidUnderlay [n: NetworkState, y: Layering] {
   y.under = n.net
-- Layering is consistent with underlay types.
   (y.overMembers).(y.attachments) in n.members
   (y.overAllGroups).(y.attachments) in n.allGroups
   (y.overAnyGroups).(y.attachments) in n.anyGroups
-- Implemented links have endpoints attached in the underlay.
   ((y.implementations).SessionIdent).(sndr + rcvrs) 
      in (y.attachments).Name
-- Group links have attached groups.
   (y.overGroupLinks).group in y.(overAllGroups + overAnyGroups)
-- The members of an implemented group map into group membership in the
-- underlay.  Note that the underlay group can be bigger than the 
-- implemented overlay group!
   all g: y.(overAllGroups + overAnyGroups), 
       k: (group.g & y.overGroupLinks)     |
   (  (k.sndr).(y.attachments) in (g.(y.attachments)).(n.groupSenders)
   && (k.rcvrs).(y.attachments) 
         in (g.(y.attachments)).(n.groupReceivers)                   )
-- Contributions to the construction of the underlay tables.
   all k: Link, s: SessionIdent |
      (k -> s) in y.implementations
   => (some h: Header |    
   -- Rules for all implemented links.
      -- Header construction.
         (   h.src = (k.sndr).(y.attachments)
         && h.sessionIdent = s && h.overlay = y.over 
      -- Contributions to sendTable.
         && (h.src -> s -> h) in n.sendTable  
      -- Contributions to forwardTable.
         && (some ki: (h.src).(n.outLinks).(n.links) |
               (Self -> h -> ki) in ((h.src).(n.forwardTables)).frows))
   -- Rules for point-to-point implemented links.
      && (k in Link - GroupLink 
      -- Header construction.
         => (  h.dst = (k.rcvrs).(y.attachments)
            && (  k in y.overOneLinks
               => h.protocol = OneWay else h.protocol = TwoWay  )
      -- Contributions to acquireTable.
            && (some ki: (h.dst).(n.inLinks).(n.links) |
                  (ki -> h -> Receive) in 
                     ((h.dst).(n.acquireTables)).arows)
      -- Contributions to receiveTable.
            && (some x: ExternalLink |
                  x.exNet = y.over
               && x.exLink = (k.rcvrs).(k.rcvrIdents)
               && ((h.dst) -> h -> x) in n.receiveTable  )  )  )
   -- Rules for group implemented links.
      && (k in GroupLink 
      -- Header construction.
         => (  h.dst = (k.group).(y.attachments)
            && (  k.group in y.overAllGroups
               => h.protocol = AllCast else h.protocol = AnyCast  )
      -- Contributions to acquireTable.
            && (all m: (k.rcvrs).(y.attachments) |
               some ki: m.(n.inLinks).(n.links) |
                  (ki -> h -> Receive) in (m.(n.acquireTables)).arows
               && (some x: ExternalLink |
      -- Contributions to receiveTable.
                     x.exNet = y.over 
                  && x.exLink = m.(k.rcvrIdents)  
                  && (m -> h -> x) in n.receiveTable  )  )  )
      )  )
}

pred Network_satisfies_overlay_demands [n: NetworkState, y: Layering] {
-- The communication demands of an overlay can be identified by the
-- session identifiers in the layering.  This property is one way of
-- checking that an instance of layering is correct.
   all s: Link.(y.implementations), h: sessionIdent.s, 
      m0, m1: n.members |
      (  (m0 -> h) in (n.effectiveSend).LinkIdent
      && (m1 -> h) in (n.effectiveReceive).LinkIdent  )
      => (h -> m0 -> m1) in n.effectivelyReachable                    }

/* --------------------------------------------------------------------
SUBDUCTION
   As can be seen from the fields of the object, subduction is similar
to bridging.
   Subduction is a special situation that can arise when a network
(usually special-purpose) is both bridged with and layered on another
network (usually general-purpose).  We believe this is common when
special-purpose IP networks interoperate with the Internet.  It is also
needed to add an overlay in which the endpoints do not participate.
-------------------------------------------------------------------- */

sig Subduction {
   general, special: NetworkState,
   sharedMembers: set Name,   -- this is why subduction is not bridging
   sharedLinks: set (Link - GroupLink),      -- no bridging with groups
   layering: Layering,
   reachableWithSubduction: Header -> Name -> Name,          -- derived
   effectivelyReachableWithSubduction: Header -> Name -> Name-- derived
}  {
-- Except for explicitly shared members, name spaces cannot overlap.
   sharedMembers in general.members && sharedMembers in special.members
   no ((general.members & special.members) - sharedMembers)
-- A shared member is the sender of some shared link, and also the
-- receiver of one.
   all m: sharedMembers | some disj k, k1: sharedLinks |
      m = k.sndr && m = k1.rcvrs
-- Shared links are shared.
   all k: sharedLinks | (k in general.links && k in special.links)
-- Shared inlinks have the same linkIdent in both networks.  Input on
-- a shared inlink is acquired deterministically by the overlay or
-- underlay.
-- Constraints on shared inlinks.
   all k: sharedLinks |
      k.rcvrs in sharedMembers 
   => (  k.sndr ! in sharedMembers
      -- The shared link has the same linkIdent in both networks.
      && (k.rcvrs).(special.inLinks).k = (k.rcvrs).(general.inLinks).k
      && (all h: Header |
            let m = k.rcvrs | let i = m.(special.inLinks).k |
            -- Input is acquired deterministically by the overlay or 
            -- underlay.
               no (h.(i.(m.(special.acquireTables).arows)) &
                   h.(i.(m.(general.acquireTables).arows)) )
            -- If a packet is being acquired by the overlay, then in
            -- the underlay, it is handled as if received on an
            -- implemented link.
            && (some h.(i.(m.(special.acquireTables).arows))
               => some x: ExternalLink | 
                     h.(m.(general.receiveTable)) = x
                  && x.exNet = special.net && x.exLink = i )
          )  )
-- Constraints on shared outlinks.
   all k: sharedLinks |
      k.sndr in sharedMembers 
   => (  k.rcvrs ! in sharedMembers
      && (let m = k.sndr | let i = m.(special.outLinks).k |
         -- The shared link has the same linkIdent in both networks.
            i = m.(general.outLinks).k
         -- The shared link has the same implementation in both 
         -- networks.
         && i.(m.(special.transmitTable)) 
               = i.(m.(general.transmitTable))                     )  )
-- The special network is layered on the general network.  Shared
-- members of the special network are attached to themselves in the
-- general network.
   layering.over = special.net && layering.under = general.net
   all m: sharedMembers | (m -> m) in layering.attachments
   (layering.implementations).SessionIdent =
      { k: special.links | k ! in sharedLinks }
   ValidOverlay [special, layering]
   ValidUnderlay [general, layering]
-- These are the exact same definitions used for bridging!
   reachableWithSubduction =
   {  h: Header, m, m1: general.members + special.members |
      some k, k1: general.links + special.links |
         m = k.sndr && m1 in k1.rcvrs
      && (k=k1 || (k ->k1) in ^(h.(general.oneHop+special.oneHop)))  }
   effectivelyReachableWithSubduction =
   {  h: Header, m, m1: general.members + special.members |
      some k, k1: general.links + special.links, kout, kin: LinkIdent |
         (m ->h ->kout) in general.effectiveSend+special.effectiveSend
      && (m -> kout -> k) in general.outLinks + special.outLinks
      && (m1 -> h -> kin) in
            general.effectiveReceive + special.effectiveReceive
      && (m1 -> kin -> k1) in general.inLinks + special.inLinks
      && (k = k1 || (k-> k1) in ^(h.(general.oneHop+special.oneHop))) }
}

/* ====================================================================
run P for 1 but
   N>=S NetworkName, S NetworkState,
   Y Layering, B Bridge, U Subduction,
   M Name, L<=K LinkIdent, K Link, D SessionIdent, D-2D Header,
   SxM AcquireTable, SxM ForwardTable, X ExternalReference
==================================================================== */
