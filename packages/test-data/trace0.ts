export const trace0: string = `<alloy builddate="2021-11-03T15:25:43.736Z">

<instance bitwidth="4" maxseq="3" mintrace="1" maxtrace="6" command="Run example for 3 but 6 steps, exactly 3 Node" filename="/private/var/folders/qb/b5m540v57ln_969zqrsgcl8w0000gn/T/alloy4tmp40-atdyer/models/examples/temporal/leader.als" tracelength="6" backloop="5">

<sig label="seq/Int" ID="0" parentID="1" builtin="yes">
</sig>

<sig label="Int" ID="1" parentID="2" builtin="yes">
</sig>

<sig label="String" ID="3" parentID="2" builtin="yes">
</sig>

<sig label="this/Node" ID="4" parentID="2">
   <atom label="Node$0"/>
   <atom label="Node$1"/>
   <atom label="Node$2"/>
</sig>

<field label="id" ID="5" parentID="4">
   <tuple> <atom label="Node$0"/> <atom label="Id$2"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<field label="succ" ID="7" parentID="4">
   <tuple> <atom label="Node$0"/> <atom label="Node$1"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Node$2"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Node$0"/> </tuple>
   <types> <type ID="4"/> <type ID="4"/> </types>
</field>

<field label="inbox" ID="8" parentID="4" var="yes">
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<field label="outbox" ID="9" parentID="4" var="yes">
   <tuple> <atom label="Node$0"/> <atom label="Id$2"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<sig label="this/Id" ID="6" parentID="2">
   <atom label="Id$0"/>
   <atom label="Id$1"/>
   <atom label="Id$2"/>
</sig>

<sig label="ordering/Ord" ID="10" parentID="2" one="yes" private="yes">
   <atom label="ordering/Ord$0"/>
</sig>

<field label="First" ID="11" parentID="10" private="yes">
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="10"/> <type ID="6"/> </types>
</field>

<field label="Next" ID="12" parentID="10" private="yes">
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$0"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$1"/> <atom label="Id$2"/> </tuple>
   <types> <type ID="10"/> <type ID="6"/> <type ID="6"/> </types>
</field>

<sig label="univ" ID="2" builtin="yes" var="yes">
</sig>

<skolem label="$this/elected" ID="m0">
   <types> <type ID="4"/> </types>
</skolem>

</instance>
<instance bitwidth="4" maxseq="3" mintrace="1" maxtrace="6" command="Run example for 3 but 6 steps, exactly 3 Node" filename="/private/var/folders/qb/b5m540v57ln_969zqrsgcl8w0000gn/T/alloy4tmp40-atdyer/models/examples/temporal/leader.als" tracelength="6" backloop="5">

<sig label="seq/Int" ID="0" parentID="1" builtin="yes">
</sig>

<sig label="Int" ID="1" parentID="2" builtin="yes">
</sig>

<sig label="String" ID="3" parentID="2" builtin="yes">
</sig>

<sig label="this/Node" ID="4" parentID="2">
   <atom label="Node$0"/>
   <atom label="Node$1"/>
   <atom label="Node$2"/>
</sig>

<field label="id" ID="5" parentID="4">
   <tuple> <atom label="Node$0"/> <atom label="Id$2"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<field label="succ" ID="7" parentID="4">
   <tuple> <atom label="Node$0"/> <atom label="Node$1"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Node$2"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Node$0"/> </tuple>
   <types> <type ID="4"/> <type ID="4"/> </types>
</field>

<field label="inbox" ID="8" parentID="4" var="yes">
   <tuple> <atom label="Node$1"/> <atom label="Id$2"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<field label="outbox" ID="9" parentID="4" var="yes">
   <tuple> <atom label="Node$1"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<sig label="this/Id" ID="6" parentID="2">
   <atom label="Id$0"/>
   <atom label="Id$1"/>
   <atom label="Id$2"/>
</sig>

<sig label="ordering/Ord" ID="10" parentID="2" one="yes" private="yes">
   <atom label="ordering/Ord$0"/>
</sig>

<field label="First" ID="11" parentID="10" private="yes">
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="10"/> <type ID="6"/> </types>
</field>

<field label="Next" ID="12" parentID="10" private="yes">
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$0"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$1"/> <atom label="Id$2"/> </tuple>
   <types> <type ID="10"/> <type ID="6"/> <type ID="6"/> </types>
</field>

<sig label="univ" ID="2" builtin="yes" var="yes">
</sig>

<skolem label="$this/elected" ID="m0">
   <types> <type ID="4"/> </types>
</skolem>

</instance>
<instance bitwidth="4" maxseq="3" mintrace="1" maxtrace="6" command="Run example for 3 but 6 steps, exactly 3 Node" filename="/private/var/folders/qb/b5m540v57ln_969zqrsgcl8w0000gn/T/alloy4tmp40-atdyer/models/examples/temporal/leader.als" tracelength="6" backloop="5">

<sig label="seq/Int" ID="0" parentID="1" builtin="yes">
</sig>

<sig label="Int" ID="1" parentID="2" builtin="yes">
</sig>

<sig label="String" ID="3" parentID="2" builtin="yes">
</sig>

<sig label="this/Node" ID="4" parentID="2">
   <atom label="Node$0"/>
   <atom label="Node$1"/>
   <atom label="Node$2"/>
</sig>

<field label="id" ID="5" parentID="4">
   <tuple> <atom label="Node$0"/> <atom label="Id$2"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<field label="succ" ID="7" parentID="4">
   <tuple> <atom label="Node$0"/> <atom label="Node$1"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Node$2"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Node$0"/> </tuple>
   <types> <type ID="4"/> <type ID="4"/> </types>
</field>

<field label="inbox" ID="8" parentID="4" var="yes">
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<field label="outbox" ID="9" parentID="4" var="yes">
   <tuple> <atom label="Node$1"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Id$2"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<sig label="this/Id" ID="6" parentID="2">
   <atom label="Id$0"/>
   <atom label="Id$1"/>
   <atom label="Id$2"/>
</sig>

<sig label="ordering/Ord" ID="10" parentID="2" one="yes" private="yes">
   <atom label="ordering/Ord$0"/>
</sig>

<field label="First" ID="11" parentID="10" private="yes">
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="10"/> <type ID="6"/> </types>
</field>

<field label="Next" ID="12" parentID="10" private="yes">
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$0"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$1"/> <atom label="Id$2"/> </tuple>
   <types> <type ID="10"/> <type ID="6"/> <type ID="6"/> </types>
</field>

<sig label="univ" ID="2" builtin="yes" var="yes">
</sig>

<skolem label="$this/elected" ID="m0">
   <types> <type ID="4"/> </types>
</skolem>

</instance>
<instance bitwidth="4" maxseq="3" mintrace="1" maxtrace="6" command="Run example for 3 but 6 steps, exactly 3 Node" filename="/private/var/folders/qb/b5m540v57ln_969zqrsgcl8w0000gn/T/alloy4tmp40-atdyer/models/examples/temporal/leader.als" tracelength="6" backloop="5">

<sig label="seq/Int" ID="0" parentID="1" builtin="yes">
</sig>

<sig label="Int" ID="1" parentID="2" builtin="yes">
</sig>

<sig label="String" ID="3" parentID="2" builtin="yes">
</sig>

<sig label="this/Node" ID="4" parentID="2">
   <atom label="Node$0"/>
   <atom label="Node$1"/>
   <atom label="Node$2"/>
</sig>

<field label="id" ID="5" parentID="4">
   <tuple> <atom label="Node$0"/> <atom label="Id$2"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<field label="succ" ID="7" parentID="4">
   <tuple> <atom label="Node$0"/> <atom label="Node$1"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Node$2"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Node$0"/> </tuple>
   <types> <type ID="4"/> <type ID="4"/> </types>
</field>

<field label="inbox" ID="8" parentID="4" var="yes">
   <tuple> <atom label="Node$2"/> <atom label="Id$2"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<field label="outbox" ID="9" parentID="4" var="yes">
   <tuple> <atom label="Node$1"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<sig label="this/Id" ID="6" parentID="2">
   <atom label="Id$0"/>
   <atom label="Id$1"/>
   <atom label="Id$2"/>
</sig>

<sig label="ordering/Ord" ID="10" parentID="2" one="yes" private="yes">
   <atom label="ordering/Ord$0"/>
</sig>

<field label="First" ID="11" parentID="10" private="yes">
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="10"/> <type ID="6"/> </types>
</field>

<field label="Next" ID="12" parentID="10" private="yes">
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$0"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$1"/> <atom label="Id$2"/> </tuple>
   <types> <type ID="10"/> <type ID="6"/> <type ID="6"/> </types>
</field>

<sig label="univ" ID="2" builtin="yes" var="yes">
</sig>

<skolem label="$this/elected" ID="m0">
   <types> <type ID="4"/> </types>
</skolem>

</instance>
<instance bitwidth="4" maxseq="3" mintrace="1" maxtrace="6" command="Run example for 3 but 6 steps, exactly 3 Node" filename="/private/var/folders/qb/b5m540v57ln_969zqrsgcl8w0000gn/T/alloy4tmp40-atdyer/models/examples/temporal/leader.als" tracelength="6" backloop="5">

<sig label="seq/Int" ID="0" parentID="1" builtin="yes">
</sig>

<sig label="Int" ID="1" parentID="2" builtin="yes">
</sig>

<sig label="String" ID="3" parentID="2" builtin="yes">
</sig>

<sig label="this/Node" ID="4" parentID="2">
   <atom label="Node$0"/>
   <atom label="Node$1"/>
   <atom label="Node$2"/>
</sig>

<field label="id" ID="5" parentID="4">
   <tuple> <atom label="Node$0"/> <atom label="Id$2"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<field label="succ" ID="7" parentID="4">
   <tuple> <atom label="Node$0"/> <atom label="Node$1"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Node$2"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Node$0"/> </tuple>
   <types> <type ID="4"/> <type ID="4"/> </types>
</field>

<field label="inbox" ID="8" parentID="4" var="yes">
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<field label="outbox" ID="9" parentID="4" var="yes">
   <tuple> <atom label="Node$1"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Id$0"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Id$2"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<sig label="this/Id" ID="6" parentID="2">
   <atom label="Id$0"/>
   <atom label="Id$1"/>
   <atom label="Id$2"/>
</sig>

<sig label="ordering/Ord" ID="10" parentID="2" one="yes" private="yes">
   <atom label="ordering/Ord$0"/>
</sig>

<field label="First" ID="11" parentID="10" private="yes">
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="10"/> <type ID="6"/> </types>
</field>

<field label="Next" ID="12" parentID="10" private="yes">
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$0"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$1"/> <atom label="Id$2"/> </tuple>
   <types> <type ID="10"/> <type ID="6"/> <type ID="6"/> </types>
</field>

<sig label="univ" ID="2" builtin="yes" var="yes">
</sig>

<skolem label="$this/elected" ID="m0">
   <types> <type ID="4"/> </types>
</skolem>

</instance>
<instance bitwidth="4" maxseq="3" mintrace="1" maxtrace="6" command="Run example for 3 but 6 steps, exactly 3 Node" filename="/private/var/folders/qb/b5m540v57ln_969zqrsgcl8w0000gn/T/alloy4tmp40-atdyer/models/examples/temporal/leader.als" tracelength="6" backloop="5">

<sig label="seq/Int" ID="0" parentID="1" builtin="yes">
</sig>

<sig label="Int" ID="1" parentID="2" builtin="yes">
</sig>

<sig label="String" ID="3" parentID="2" builtin="yes">
</sig>

<sig label="this/Node" ID="4" parentID="2">
   <atom label="Node$0"/>
   <atom label="Node$1"/>
   <atom label="Node$2"/>
</sig>

<field label="id" ID="5" parentID="4">
   <tuple> <atom label="Node$0"/> <atom label="Id$2"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<field label="succ" ID="7" parentID="4">
   <tuple> <atom label="Node$0"/> <atom label="Node$1"/> </tuple>
   <tuple> <atom label="Node$1"/> <atom label="Node$2"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Node$0"/> </tuple>
   <types> <type ID="4"/> <type ID="4"/> </types>
</field>

<field label="inbox" ID="8" parentID="4" var="yes">
   <tuple> <atom label="Node$0"/> <atom label="Id$2"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<field label="outbox" ID="9" parentID="4" var="yes">
   <tuple> <atom label="Node$1"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="Node$2"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="4"/> <type ID="6"/> </types>
</field>

<sig label="this/Id" ID="6" parentID="2">
   <atom label="Id$0"/>
   <atom label="Id$1"/>
   <atom label="Id$2"/>
</sig>

<sig label="ordering/Ord" ID="10" parentID="2" one="yes" private="yes">
   <atom label="ordering/Ord$0"/>
</sig>

<field label="First" ID="11" parentID="10" private="yes">
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$0"/> </tuple>
   <types> <type ID="10"/> <type ID="6"/> </types>
</field>

<field label="Next" ID="12" parentID="10" private="yes">
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$0"/> <atom label="Id$1"/> </tuple>
   <tuple> <atom label="ordering/Ord$0"/> <atom label="Id$1"/> <atom label="Id$2"/> </tuple>
   <types> <type ID="10"/> <type ID="6"/> <type ID="6"/> </types>
</field>

<sig label="univ" ID="2" builtin="yes" var="yes">
</sig>

<skolem label="$this/elected" ID="m0">
   <tuple> <atom label="Node$0"/> </tuple>
   <types> <type ID="4"/> </types>
</skolem>

</instance>

<source filename="/private/var/folders/qb/b5m540v57ln_969zqrsgcl8w0000gn/T/alloy4tmp40-atdyer/models/examples/temporal/leader.als" content="open util/ordering[Id]&#x000a;&#x000a;sig Node {&#x000a;&#x0009;id : one Id,&#x000a;&#x0009;succ : one Node,&#x000a;&#x0009;var inbox : set Id,&#x000a;&#x0009;var outbox : set Id&#x000a;}&#x000a;&#x000a;sig Id {}&#x000a;&#x000a;fact ring {&#x000a;&#x0009;all i : Id | lone id.i&#x000a;&#x0009;all n : Node | Node in n.^succ&#x000a;}&#x000a;&#x000a;fun elected : set Node {&#x000a;&#x0009;{n : Node | once (n.id in n.inbox)}&#x000a;}&#x000a;&#x000a;pred send [n : Node] {&#x000a;&#x0009;some i : n.outbox {&#x000a;&#x0009;&#x0009;n.outbox&apos; = n.outbox - i&#x000a;&#x0009;&#x0009;n.succ.inbox&apos; = n.succ.inbox + i&#x000a;&#x0009;}&#x000a;&#x0009;all m : Node - n.succ | m.inbox&apos; = m.inbox&#x000a;&#x0009;all m : Node - n | m.outbox&apos; = m.outbox&#x000a;}&#x000a;&#x000a;pred compute [n : Node] {&#x000a;&#x0009;some i : n.inbox {&#x000a;&#x0009;&#x0009;n.inbox&apos; = n.inbox - i&#x000a;&#x0009;&#x0009;n.outbox&apos; = n.outbox + (i - n.id.*(~next))&#x000a;&#x0009;}&#x000a;&#x0009;all m : Node - n | m.inbox&apos; = m.inbox&#x000a;&#x0009;all m : Node - n | m.outbox&apos; = m.outbox&#x000a;}&#x000a;&#x000a;pred skip {&#x000a;&#x0009;inbox&apos; = inbox&#x000a;&#x0009;outbox&apos; = outbox&#x000a;}&#x000a;&#x000a;fact init {&#x000a;&#x0009;no inbox&#x000a;&#x0009;outbox = id&#x000a;}&#x000a;&#x000a;fact transitions {&#x000a;&#x0009;always (skip or some n : Node | send[n] or compute[n])&#x000a;}&#x000a;&#x000a;run {} for 4 but exactly 4 Node, 10 steps&#x000a;run example {eventually some elected} for 3 but exactly 3 Node, 6 steps&#x000a;&#x000a;assert safety {&#x000a;&#x0009;always lone elected&#x000a;}&#x000a;check safety for 3 but 15 steps&#x000a;&#x000a;&#x000a;pred sendEnabled [n : Node] {&#x000a;&#x0009;some n.outbox&#x000a;}&#x000a;&#x000a;pred computeEnabled [n : Node] {&#x000a;&#x0009;some n.inbox&#x000a;}&#x000a;&#x000a;pred fairness {&#x000a;&#x0009;all n : Node {&#x000a;&#x0009;&#x0009;(eventually always sendEnabled[n] implies (always eventually send[n]))&#x000a;&#x0009;&#x0009;(eventually always computeEnabled[n] implies (always eventually compute[n]))&#x000a;&#x0009;}&#x000a;}&#x000a;&#x000a;assert liveness {&#x000a;&#x0009;eventually some elected&#x000a;//&#x0009;fairness implies eventually some elected&#x000a;//&#x0009;fairness and some Node implies eventually some elected&#x000a;}&#x000a;check liveness for 3&#x000a;"/>

<source filename="/$alloy4$/models/util/integer.als" content="module util/integer&#x000a;&#x000a;/*&#x000a; * A collection of utility functions for using Integers in Alloy.&#x000a; * Note that integer overflows are silently truncated to the current bitwidth&#x000a; * using the 2&apos;s complement arithmetic, unless the &quot;forbid overfows&quot; option is&#x000a; * turned on, in which case only models that don&apos;t have any overflows are &#x000a; * analyzed. &#x000a; */&#x000a;&#x000a;fun add  [n1, n2: Int] : Int { this/plus[n1, n2] }&#x000a;fun plus [n1, n2: Int] : Int { n1 fun/add n2 }&#x000a;&#x000a;fun sub   [n1, n2: Int] : Int { this/minus[n1, n2] }&#x000a;fun minus [n1, n2: Int] : Int { n1 fun/sub n2 }&#x000a;&#x000a;fun mul [n1, n2: Int] : Int { n1 fun/mul n2 }&#x000a;&#x000a;/**&#x000a; * Performs the division with &quot;round to zero&quot; semantics, except the following 3 cases&#x000a; * 1) if a is 0, then it returns 0&#x000a; * 2) else if b is 0, then it returns 1 if a is negative and -1 if a is positive&#x000a; * 3) else if a is the smallest negative integer, and b is -1, then it returns a&#x000a; */&#x000a;fun div [n1, n2: Int] : Int { n1 fun/div n2 }&#x000a;&#x000a;/** answer is defined to be the unique integer that satisfies &quot;a = ((a/b)*b) + remainder&quot; */&#x000a;fun rem [n1, n2: Int] : Int { n1 fun/rem n2 }&#x000a;&#x000a;/** negate */&#x000a;fun negate [n: Int] : Int { 0 fun/sub n }&#x000a;&#x000a;/** equal to */&#x000a;pred eq [n1, n2: Int] { int[n1] = int[n2] }&#x000a;&#x000a;/** greater than */&#x000a;pred gt [n1, n2: Int] { n1 &gt; n2 }&#x000a;&#x000a;/** less then */&#x000a;pred lt [n1, n2: Int] { n1 &lt; n2 }&#x000a;&#x000a;/** greater than or equal */&#x000a;pred gte [n1, n2: Int] { n1 &gt;= n2 }&#x000a;&#x000a;/** less than or equal */&#x000a;pred lte [n1, n2: Int] { n1 &lt;= n2 }&#x000a;&#x000a;/** integer is zero */&#x000a;pred zero [n: Int] { n = 0 }&#x000a;&#x000a;/** positive */&#x000a;pred pos  [n: Int] { n &gt; 0 }&#x000a;&#x000a;/** negative */&#x000a;pred neg  [n: Int] { n &lt; 0 }&#x000a;&#x000a;/** non-positive */&#x000a;pred nonpos [n: Int] { n &lt;= 0 }&#x000a;&#x000a;/** non-negative */&#x000a;pred nonneg [n: Int] { n &gt;= 0 }&#x000a;&#x000a;/** signum (aka sign or sgn) */&#x000a;fun signum [n: Int] : Int { n&lt;0 =&gt; (0 fun/sub 1) else (n&gt;0 =&gt; 1 else 0) }&#x000a;&#x000a;/**&#x000a; * returns the ith element (zero-based) from the set s&#x000a; * in the ordering of &apos;next&apos;, which is a linear ordering&#x000a; * relation like that provided by util/ordering&#x000a; */&#x000a;fun int2elem[i: Int, next: univ-&gt;univ, s: set univ] : lone s {&#x000a;  {e: s | #^next.e = int i }&#x000a;}&#x000a;&#x000a;/**&#x000a; * returns the index of the element (zero-based) in the&#x000a; * ordering of next, which is a linear ordering relation&#x000a; * like that provided by util/ordering&#x000a; */&#x000a;fun elem2int[e: univ, next: univ-&gt;univ] : lone Int {&#x000a;  Int[#^next.e]&#x000a;}&#x000a;&#x000a;/** returns the largest integer in the current bitwidth */&#x000a;fun max:one Int { fun/max }&#x000a;&#x000a;/** returns the smallest integer in the current bitwidth */&#x000a;fun min:one Int { fun/min }&#x000a;&#x000a;/** maps each integer (except max) to the integer after it */&#x000a;fun next:Int-&gt;Int { fun/next }&#x000a;&#x000a;/** maps each integer (except min) to the integer before it */&#x000a;fun prev:Int-&gt;Int { ~next }&#x000a;&#x000a;/** given a set of integers, return the largest element */&#x000a;fun max [es: set Int]: lone Int { es - es.^prev }&#x000a;&#x000a;/** given a set of integers, return the smallest element */&#x000a;fun min [es: set Int]: lone Int { es - es.^next }&#x000a;&#x000a;/** given an integer, return all integers prior to it */&#x000a;fun prevs [e: Int]: set Int { e.^prev }&#x000a;&#x000a;/** given an integer, return all integers following it */&#x000a;fun nexts [e: Int]: set Int { e.^next }&#x000a;&#x000a;/** returns the larger of the two integers */&#x000a;fun larger [e1, e2: Int]: Int { let a=int[e1], b=int[e2] | (a&lt;b =&gt; b else a) }&#x000a;&#x000a;/** returns the smaller of the two integers */&#x000a;fun smaller [e1, e2: Int]: Int { let a=int[e1], b=int[e2] | (a&lt;b =&gt; a else b) }&#x000a;"/>

<source filename="/$alloy4$/models/util/ordering.als" content="module util/ordering[exactly elem]&#x000a;&#x000a;/*&#x000a; * Creates a single linear ordering over the atoms in elem. It also constrains all&#x000a; * the atoms to exist that are permitted by the scope on elem. That is, if the scope&#x000a; * on a signature S is 5, opening util/ordering[S] will force S to have 5 elements&#x000a; * and create a linear ordering over those five elements. The predicates and&#x000a; * functions below provide access to properties of the linear ordering, such as&#x000a; * which element is first in the ordering, or whether a given element precedes&#x000a; * another. You cannotcreate multiple linear orderings over the same signature with&#x000a; * this model. If you that functionality, try using the util/sequence module instead.&#x000a; *&#x000a; * Technical comment:&#x000a; * An important constraint: elem must contain all atoms permitted by the scope.&#x000a; * This is to let the analyzer optimize the analysis by setting all fields of each&#x000a; * instantiation of Ord to predefined values: e.g. by setting &apos;last&apos; to the highest&#x000a; * atom of elem and by setting &apos;next&apos; to {&lt;T0,T1&gt;,&lt;T1,T2&gt;,...&lt;Tn-1,Tn&gt;}, where n is&#x000a; * the scope of elem. Without this constraint, it might not be true that Ord.last is&#x000a; * a subset of elem, and that the domain and range of Ord.next lie inside elem.&#x000a; *&#x000a; * author: Ilya Shlyakhter&#x000a; * revisions: Daniel jackson&#x000a; */&#x000a;&#x000a;private one sig Ord {&#x000a;   First: set elem,&#x000a;   Next: elem -&gt; elem&#x000a;} {&#x000a;   pred/totalOrder[elem,First,Next]&#x000a;}&#x000a;&#x000a;/** first */&#x000a;fun first: one elem { Ord.First }&#x000a;&#x000a;/** last */&#x000a;fun last: one elem { elem - (next.elem) }&#x000a;&#x000a;/** return a mapping from each element to its predecessor */&#x000a;fun prev : elem-&gt;elem { ~(Ord.Next) }&#x000a;&#x000a;/** return a mapping from each element to its successor */&#x000a;fun next : elem-&gt;elem { Ord.Next }&#x000a;&#x000a;/** return elements prior to e in the ordering */&#x000a;fun prevs [e: elem]: set elem { e.^(~(Ord.Next)) }&#x000a;&#x000a;/** return elements following e in the ordering */&#x000a;fun nexts [e: elem]: set elem { e.^(Ord.Next) }&#x000a;&#x000a;/** e1 is less than e2 in the ordering */&#x000a;pred lt [e1, e2: elem] { e1 in prevs[e2] }&#x000a;&#x000a;/** e1 is greater than e2 in the ordering */&#x000a;pred gt [e1, e2: elem] { e1 in nexts[e2] }&#x000a;&#x000a;/** e1 is less than or equal to e2 in the ordering */&#x000a;pred lte [e1, e2: elem] { e1=e2 || lt [e1,e2] }&#x000a;&#x000a;/** e1 is greater than or equal to e2 in the ordering */&#x000a;pred gte [e1, e2: elem] { e1=e2 || gt [e1,e2] }&#x000a;&#x000a;/** returns the larger of the two elements in the ordering */&#x000a;fun larger [e1, e2: elem]: elem { lt[e1,e2] =&gt; e2 else e1 }&#x000a;&#x000a;/** returns the smaller of the two elements in the ordering */&#x000a;fun smaller [e1, e2: elem]: elem { lt[e1,e2] =&gt; e1 else e2 }&#x000a;&#x000a;/**&#x000a; * returns the largest element in es&#x000a; * or the empty set if es is empty&#x000a; */&#x000a;fun max [es: set elem]: lone elem { es - es.^(~(Ord.Next)) }&#x000a;&#x000a;/**&#x000a; * returns the smallest element in es&#x000a; * or the empty set if es is empty&#x000a; */&#x000a;fun min [es: set elem]: lone elem { es - es.^(Ord.Next) }&#x000a;&#x000a;assert correct {&#x000a;  let mynext = Ord.Next |&#x000a;  let myprev = ~mynext | {&#x000a;     ( all b:elem | (lone b.next) &amp;&amp; (lone b.prev) &amp;&amp; (b !in b.^mynext) )&#x000a;     ( (no first.prev) &amp;&amp; (no last.next) )&#x000a;     ( all b:elem | (b!=first &amp;&amp; b!=last) =&gt; (one b.prev &amp;&amp; one b.next) )&#x000a;     ( !one elem =&gt; (one first &amp;&amp; one last &amp;&amp; first!=last &amp;&amp; one first.next &amp;&amp; one last.prev) )&#x000a;     ( one elem =&gt; (first=elem &amp;&amp; last=elem &amp;&amp; no myprev &amp;&amp; no mynext) )&#x000a;     ( myprev=~mynext )&#x000a;     ( elem = first.*mynext )&#x000a;     (all disj a,b:elem | a in b.^mynext or a in b.^myprev)&#x000a;     (no disj a,b:elem | a in b.^mynext and a in b.^myprev)&#x000a;     (all disj a,b,c:elem | (b in a.^mynext and c in b.^mynext) =&gt;(c in a.^mynext))&#x000a;     (all disj a,b,c:elem | (b in a.^myprev and c in b.^myprev) =&gt;(c in a.^myprev))&#x000a;  }&#x000a;}&#x000a;run {} for exactly 0 elem expect 0&#x000a;run {} for exactly 1 elem expect 1&#x000a;run {} for exactly 2 elem expect 1&#x000a;run {} for exactly 3 elem expect 1&#x000a;run {} for exactly 4 elem expect 1&#x000a;check correct for exactly 0 elem&#x000a;check correct for exactly 1 elem&#x000a;check correct for exactly 2 elem&#x000a;check correct for exactly 3 elem&#x000a;check correct for exactly 4 elem&#x000a;check correct for exactly 5 elem&#x000a;"/>

</alloy>`;
