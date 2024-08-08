## Penrose Visualizations for Forge

1. Run `npm install`
2. Run in dev mode using `nodemon --exec ts-node src/index.ts`
3. Application should be available at `localhost:3000`. It expects an Alloy datum and visualization constraints (see examples below)

### Alloy Datum
```
<alloy builddate="Thursday, July 25th, 2024">
<instance bitwidth="4" maxseq="-1" command="temporary-name_scratch_1" filename="/no-name.rkt" version="3.5"  >

<sig label="seq/Int" ID="0" parentID="1" builtin="yes">
</sig>

<sig label="Int" ID="1" parentID="2" builtin="yes">
</sig>

<sig label="univ" ID="2" builtin="yes">
</sig>

<field label="no-field-guard" ID="3" parentID="2">
<types> <type ID="2"/><type ID="2"/> </types>
</field>

<sig label="Shore" ID="4" parentID="2">

</sig>

<sig label="Far" ID="5" parentID="4">
<atom label="Far0"/>
</sig>

<sig label="Node" ID="6" parentID="2">

</sig>

<sig label="Branch" ID="7" parentID="6">
<atom label="Branch0"/><atom label="Branch1"/>
</sig>

<sig label="Near" ID="8" parentID="4">
<atom label="Near0"/>
</sig>

<sig label="Leaf" ID="9" parentID="6">
<atom label="Node0"/><atom label="Node1"/><atom label="Node2"/>
</sig>

<field label="left" ID="10" parentID="7">
<tuple><atom label="Branch0"/><atom label="Node2"/></tuple>
<tuple><atom label="Branch1"/><atom label="Branch0"/></tuple>
<types><type ID="7"/><type ID="6"/></types>

</field>

<field label="right" ID="11" parentID="7">
<tuple><atom label="Branch0"/><atom label="Node1"/></tuple>
<tuple><atom label="Branch1"/><atom label="Node0"/></tuple>
<types><type ID="7"/><type ID="6"/></types>

</field>

<field label="pos" ID="12" parentID="6">
<tuple><atom label="Branch0"/><atom label="Far0"/></tuple>
<tuple><atom label="Branch1"/><atom label="Far0"/></tuple>
<tuple><atom label="Node0"/><atom label="Near0"/></tuple>
<tuple><atom label="Node1"/><atom label="Near0"/></tuple>
<tuple><atom label="Node2"/><atom label="Near0"/></tuple>
<types><type ID="6"/><type ID="4"/></types>

</field>

<skolem label="$root_some18085" ID="13">
<tuple><atom label="Branch1"/></tuple>
<types><type ID="2"/></types>

</skolem>


</instance>

<source filename="/no-name.rkt" content="// Couldn't open source file (/no-name.rkt) (info: (2 . posix)). Is the file saved?"></source>
</alloy>
```

### Visualization constraints
```
{
  "fieldDirections": [
    {
      "fieldName": "left",
      "directions": ["below", "left"]
    },
    {
      "fieldName": "right",
      "directions": ["below", "right"]
    }
  ],
  "groupBy": [
    {
      "fieldName" : "pos"
    }
  ],
  "attributeFields" : [],
  "hideDisconnected" : true,
  "hideDisconnectedBuiltIns" : false
}
```


## Current Issues


- [] Currently only show a visualization for the *first* alloy instance in the datum




- [] Infer setcola constraints from layout.
- [] Better support for n-ary relations (by default, Sterling does something like `a[b] -> c` for `a ->b -> c` I think)
- [] Grouping: We lose the relation name I suppose

### WebCola

- [] Better Label Layout: https://medium.com/@adarshlilha/removing-label-overlapping-from-pretty-charts-8dd2e3581b71
- [] I think WebCola struggles with groups that intersect but are not subgroups of one another