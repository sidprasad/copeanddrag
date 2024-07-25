// src/index.ts
import * as http from 'http';
import { AlloyDatum, AlloyInstance, parseAlloyXML } from './alloy-instance';
import { PenroseInstance } from './penroseinstance';
import { LayoutInstance } from './layoutinstance';
import multer from 'multer';


const express = require('express');
const path = require('path');



const trace1 = `<alloy builddate="2021-11-03T15:25:43.736Z">

<instance bitwidth="4" maxseq="4" mintrace="2" maxtrace="2" command="Run binaryTree for 2..2 steps, exactly 4 Branch, 5 Leaf" filename="/Users/atdyer/research/alloy/alloy6/Untitled 1.als" tracelength="2" backloop="0">

<sig label="seq/Int" ID="0" parentID="1" builtin="yes">
</sig>

<sig label="Int" ID="1" parentID="2" builtin="yes">
</sig>

<sig label="String" ID="3" parentID="2" builtin="yes">
</sig>

<sig label="this/Leaf" ID="4" parentID="5">
   <atom label="Leaf$0"/>
   <atom label="Leaf$1"/>
   <atom label="Leaf$2"/>
   <atom label="Leaf$3"/>
   <atom label="Leaf$4"/>
</sig>

<sig label="this/Branch" ID="6" parentID="5">
   <atom label="Branch$0"/>
   <atom label="Branch$1"/>
   <atom label="Branch$2"/>
   <atom label="Branch$3"/>
</sig>

<field label="left" ID="7" parentID="6" var="yes">
   <tuple> <atom label="Branch$0"/> <atom label="Branch$3"/> </tuple>
   <tuple> <atom label="Branch$1"/> <atom label="Branch$2"/> </tuple>
   <tuple> <atom label="Branch$2"/> <atom label="Branch$0"/> </tuple>
   <tuple> <atom label="Branch$3"/> <atom label="Leaf$4"/> </tuple>
   <types> <type ID="6"/> <type ID="5"/> </types>
</field>

<field label="right" ID="8" parentID="6" var="yes">
   <tuple> <atom label="Branch$0"/> <atom label="Leaf$3"/> </tuple>
   <tuple> <atom label="Branch$1"/> <atom label="Leaf$2"/> </tuple>
   <tuple> <atom label="Branch$2"/> <atom label="Leaf$1"/> </tuple>
   <tuple> <atom label="Branch$3"/> <atom label="Leaf$0"/> </tuple>
   <types> <type ID="6"/> <type ID="5"/> </types>
</field>

<sig label="this/Node" ID="5" parentID="2" abstract="yes">
</sig>

<sig label="univ" ID="2" builtin="yes" var="yes">
</sig>

<skolem label="$binaryTree_root" ID="9">
   <tuple> <atom label="Branch$1"/> </tuple>
   <types> <type ID="5"/> </types>
</skolem>

</instance>

<source filename="/Users/atdyer/research/alloy/alloy6/Untitled 1.als" content="abstract sig Node {}&#x000a;sig Leaf extends Node {}&#x000a;sig Branch extends Node {&#x000a;  var left: one Node,&#x000a;  var right: one Node&#x000a;}&#x000a;&#x000a;pred binaryTree {&#x000a;  some root: Node {&#x000a;    Node in root.^(left + right) + root&#x000a;  }&#x000a;  always all n: Node {&#x000a;    n not in n.^(left + right)&#x000a;    lone n.~(left + right)&#x000a;    no n.left &amp; n.right&#x000a;  }&#x000a;}&#x000a;&#x000a;run binaryTree for exactly 4 Branch, 5 Leaf, exactly 2 steps"/>

<source filename="/$alloy4$/models/util/integer.als" content="module util/integer&#x000a;&#x000a;/*&#x000a; * A collection of utility functions for using Integers in Alloy.&#x000a; * Note that integer overflows are silently truncated to the current bitwidth&#x000a; * using the 2&apos;s complement arithmetic, unless the &quot;forbid overfows&quot; option is&#x000a; * turned on, in which case only models that don&apos;t have any overflows are &#x000a; * analyzed. &#x000a; */&#x000a;&#x000a;fun add  [n1, n2: Int] : Int { this/plus[n1, n2] }&#x000a;fun plus [n1, n2: Int] : Int { n1 fun/add n2 }&#x000a;&#x000a;fun sub   [n1, n2: Int] : Int { this/minus[n1, n2] }&#x000a;fun minus [n1, n2: Int] : Int { n1 fun/sub n2 }&#x000a;&#x000a;fun mul [n1, n2: Int] : Int { n1 fun/mul n2 }&#x000a;&#x000a;/**&#x000a; * Performs the division with &quot;round to zero&quot; semantics, except the following 3 cases&#x000a; * 1) if a is 0, then it returns 0&#x000a; * 2) else if b is 0, then it returns 1 if a is negative and -1 if a is positive&#x000a; * 3) else if a is the smallest negative integer, and b is -1, then it returns a&#x000a; */&#x000a;fun div [n1, n2: Int] : Int { n1 fun/div n2 }&#x000a;&#x000a;/** answer is defined to be the unique integer that satisfies &quot;a = ((a/b)*b) + remainder&quot; */&#x000a;fun rem [n1, n2: Int] : Int { n1 fun/rem n2 }&#x000a;&#x000a;/** negate */&#x000a;fun negate [n: Int] : Int { 0 fun/sub n }&#x000a;&#x000a;/** equal to */&#x000a;pred eq [n1, n2: Int] { int[n1] = int[n2] }&#x000a;&#x000a;/** greater than */&#x000a;pred gt [n1, n2: Int] { n1 &gt; n2 }&#x000a;&#x000a;/** less then */&#x000a;pred lt [n1, n2: Int] { n1 &lt; n2 }&#x000a;&#x000a;/** greater than or equal */&#x000a;pred gte [n1, n2: Int] { n1 &gt;= n2 }&#x000a;&#x000a;/** less than or equal */&#x000a;pred lte [n1, n2: Int] { n1 &lt;= n2 }&#x000a;&#x000a;/** integer is zero */&#x000a;pred zero [n: Int] { n = 0 }&#x000a;&#x000a;/** positive */&#x000a;pred pos  [n: Int] { n &gt; 0 }&#x000a;&#x000a;/** negative */&#x000a;pred neg  [n: Int] { n &lt; 0 }&#x000a;&#x000a;/** non-positive */&#x000a;pred nonpos [n: Int] { n &lt;= 0 }&#x000a;&#x000a;/** non-negative */&#x000a;pred nonneg [n: Int] { n &gt;= 0 }&#x000a;&#x000a;/** signum (aka sign or sgn) */&#x000a;fun signum [n: Int] : Int { n&lt;0 =&gt; (0 fun/sub 1) else (n&gt;0 =&gt; 1 else 0) }&#x000a;&#x000a;/**&#x000a; * returns the ith element (zero-based) from the set s&#x000a; * in the ordering of &apos;next&apos;, which is a linear ordering&#x000a; * relation like that provided by util/ordering&#x000a; */&#x000a;fun int2elem[i: Int, next: univ-&gt;univ, s: set univ] : lone s {&#x000a;  {e: s | #^next.e = int i }&#x000a;}&#x000a;&#x000a;/**&#x000a; * returns the index of the element (zero-based) in the&#x000a; * ordering of next, which is a linear ordering relation&#x000a; * like that provided by util/ordering&#x000a; */&#x000a;fun elem2int[e: univ, next: univ-&gt;univ] : lone Int {&#x000a;  Int[#^next.e]&#x000a;}&#x000a;&#x000a;/** returns the largest integer in the current bitwidth */&#x000a;fun max:one Int { fun/max }&#x000a;&#x000a;/** returns the smallest integer in the current bitwidth */&#x000a;fun min:one Int { fun/min }&#x000a;&#x000a;/** maps each integer (except max) to the integer after it */&#x000a;fun next:Int-&gt;Int { fun/next }&#x000a;&#x000a;/** maps each integer (except min) to the integer before it */&#x000a;fun prev:Int-&gt;Int { ~next }&#x000a;&#x000a;/** given a set of integers, return the largest element */&#x000a;fun max [es: set Int]: lone Int { es - es.^prev }&#x000a;&#x000a;/** given a set of integers, return the smallest element */&#x000a;fun min [es: set Int]: lone Int { es - es.^next }&#x000a;&#x000a;/** given an integer, return all integers prior to it */&#x000a;fun prevs [e: Int]: set Int { e.^prev }&#x000a;&#x000a;/** given an integer, return all integers following it */&#x000a;fun nexts [e: Int]: set Int { e.^next }&#x000a;&#x000a;/** returns the larger of the two integers */&#x000a;fun larger [e1, e2: Int]: Int { let a=int[e1], b=int[e2] | (a&lt;b =&gt; b else a) }&#x000a;&#x000a;/** returns the smaller of the two integers */&#x000a;fun smaller [e1, e2: Int]: Int { let a=int[e1], b=int[e2] | (a&lt;b =&gt; a else b) }&#x000a;"/>

</alloy>
`;




const app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');




// Define the /penrosefiles endpoint that accepts POST requests
app.post('/penrosefiles', (req, res) => {
  
    // The request has a form-data body with an alloydatum field and a layoutannotation field.
    
    const alloyDatum = req.body.alloydatum;
    const layoutAnnotation = req.body.layoutannotation;

    let ad : AlloyDatum = parseAlloyXML(alloyDatum);
    let instances = ad.instances;


    /// TODO: Generate for each instance ///
    let instance = instances[0];

    let li = new LayoutInstance(layoutAnnotation);
    let pt = new PenroseInstance(instance, li);

    let s = pt.getSubstance();
    let d = pt.getDomain();
    let sty = pt.getStyle();
    
    // res.send({
    //     substance: s,
    //     domain: d,
    //     style: sty
    // });

    res.render('penrosevjs', { 'substance': s, 'domain': d, 'style': sty });

});


const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});