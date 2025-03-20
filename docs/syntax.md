# Syntax

Cope-and-Drag (CnD) uses a YAML-like syntax to define constraints and directives for refining Alloy-generated diagrams. A CnD specification consists of two primary components:

- **Constraints**: Define spatial relationships between elements.
- **Directives**: Control visual styling and representation.

## Structure of a CnD Program

A basic CnD specification follows this structure:

```yaml
constraints:
  - <constraint-type>: <parameters>
  - <constraint-type>: <parameters>
  - <constraint-type>: <parameters>
  .
  .
  .

directives:
  - <directive-type>: <parameters>
  - <directive-type>: <parameters>
  .
  .
  .
```

---

# Constraints
Constraints define spatial relationships between elements in the diagram. Each constraint consists of a **type** and associated **parameters**.

## **Cyclic Constraints**
Cyclic constraints arranges elements related by a field in a circular layout.


```yaml
constraints:
  - cyclic:
      field: next
      direction: clockwise  
      appliesTo: [Node, Node]
```

#### Parameters

- `field` : Name of the field in the source specification upon which the constraint acts
- `direction` : [Optional] Direction in which elements will be laid out. One of `clockwise` or `counterclockwise`. Defaults to `clockwise`
- `appliesTo` : [Optional] List of the form [`sourceSig`, `targetSig`] , describing output graph edges to which this constraint applies. Defaults to [`univ`, `univ`] (that is, all types).



## **Orientation Constraints**
Specify the relative positioning of elements.

### Orientation for Fields

```yaml
constraints:
  - orientation:
      field: next
      directions: [left, below]  # Multiple allowed
```

#### Parameters

- `field` : Name of the field in the source specification upon which the constraint acts.
- `directions` : Directions in which elements will be laid out. List of directions, which can be
                `left`, `right`, `above`, `below`, `directlyAbove`, `directlyBelow`, `directlyLeft`, `directlyRight`.

- `appliesTo` : [Optional] List of the form [`sourceSig`, `targetSig`] , describing output graph edges to which this constraint applies. Defaults to [`univ`, `univ`] (that is, all types).

### Orientation for Sigs

Alternatively, orientation can apply to entire sigs, defining constraints between all atoms of certain sig types.

```yaml
constraints:
  - orientation:
      sigs: [A, B]
      directions: [above]
```


#### Parameters

- `sigs` : List of sig names the source specification upon which the constraint acts. This list can have exactly 2 elements.
- `directions` : Directions in which elements will be laid out. List of directions, which can be
                `left`, `right`, `above`, `below`, `directlyAbove`, `directlyBelow`, `directlyLeft`, `directlyRight`.



## **Grouping Constraints**
Group elements together based on a field.

```yaml
constraints:
  - group:
      field: category
      target: domain  # or range
```

#### Parameters

- `field` : Name of the field in the source specification upon which the constraint acts.
- `target` : [Optional] Which part of the field relation is grouped *upon*. Can be `range`  or `domain`. Default is `range`.


------

# Directives
Directives control the visual representation of elements, including icons, colors, attributes, and visibility.

### **Attribute Directives**

These replace graph edges representing a relation with attribute fields within the source node of the edge. 

```
directives:
    - attribute: {field: id}
```

#### Parameters
- `field` : Name of the field in the source specification upon which the constraint acts.



### **Pictorial Directives**
Assign an icon to all atoms of a certain sig.

```yaml
directives:
  - pictorial:
      sig: Person
      icon:
        path: /path/to/person.png
        height: 20
        width: 20
```

#### Parameters

- `sig` : Sig name in the source specification.
- `icon` : Object describing how the icon should be displayed.
  - `path` : Path to the icon image (`png` and `jpg` supported).
  - `height` : Height with which the icon should be displayed.
  - `width` : Width with which the icon should be displayed.




### **Color Directives**

Allow specific hex-colors (or simple color names) to be associated with `sigs`.

```
directives:
    - color:
        sig: Apple
        value: "red"
```

#### Parameters

- `sig` : Sig name in the source specification.
- `value` : Hex (or simple english) description of the color to be applied.




### **Projection**
These allow [projections](https://alloy.readthedocs.io/en/latest/tooling/visualizer.html#projection) over atoms of a certain type. 

```
directives:
    - projection: {sig: Ord}
```

#### Parameters
- `sig` : Sig name in the source specification.



### **Visibility Flags**
Controls which elements are hidden. 

```
directives:
    - flag: hideDisconnectedBuiltIns
```

Current flags are:
  - `hideDisconnected`: If true, hide all atoms in the graph that are not referenced by a relation.
  - `hideDisconnectedBuiltIns`: If true, hide all atoms of built-in type (ex. `Int`) that are not referenced by a relation.

