# Constraints

Cope and Drag **constraints** define rules about the relative positions of diagram elements.


### **Cyclic Constraints**
Cyclic constraints enforce that elements related by a given field should be arranged in a circular layout.

Example:
```yaml
- cyclic:
    field: next
    direction: clockwise
```
This ensures that elements linked by `next` form a cycle in a consistent direction.

### **Orientation Constraints**
Orientation constraints specify the relative positioning of elements.

Example:
```yaml
- orientation:
    field: c1
    directions: [left, below]
- orientation:
    field: c2
    directions: [right, below]
```
This ensures that elements connected via `c1` are placed to the left and below their parent, while `c2` elements are positioned to the right and below.

### **Grouping Constraints**
Grouping constraints enforce that related elements are visually grouped together.

Example:
```yaml
- group:
    field: category
    target: domain
```
This ensures that all elements related by `category` are placed within a shared boundary.
Groups cannot share boundaries.



### When Constraints Cannot Be Satisfied

All CnD constraints are **hard constraints**, and thus must be satisfied for a diagram to be produced. Constraints might not be satisfied for one of two reasons:

1. **A single CnD constraint definition could be inherently unsatisfiable.** For example, a constraint on the `next` field that requires the same field to be laid out both leftwards and rightwards:

   ```yaml
   - orientation:
       field: next
       directions: [right, left]
   ```

   This represents a bug in the CnD spec, and can be identified statically. In this case, CnD produces an error message in terms of the constraints that could not be satisfied:

   ```
   Error: Inconsistent orientation constraint:
   Field `next` cannot be laid out with directions: right, left.
   ```
2. **Some constraints may be individually satisfiable, but become contradictory when laying out a specific instance.** This is akin to a dynamic error, as it depends on the structure of the instance being visualized. For example, consider the constraints:

   ```yaml
   - orientation:
       sigs: [X, Y]
       directions: [below]
   - orientation:
       sigs: [Y, Z]
       directions: [below]
   - orientation:
       sigs: [Z, X]
       directions: [below]
   ```
   If an instance’s elements form a cyclic dependency, the constraints become unsatisfiable. However, an instance may lack atoms of, say, `Z`, in which case the constraints are satisfiable.


In both these cases, CnD **does not produce a diagram**. Instead, it provides an error message explaining that the constraints could not be met. 
