# Evaluators

Evaluators interpret the *selector expressions* you write in a CnD spec. They're how `parent`, `Person.friends`, or `^next` turn into concrete sets of atoms and tuples from your data.

CnD ships three evaluators, each with its own query language. Pick the one that fits your data and your audience:

| Evaluator | Query Language | Best For |
|-----------|---------------|----------|
| `SGraphQueryEvaluator` (SGQ) | Simple Graph Query DSL | Most use cases, simple syntax |
| `ForgeEvaluator` | Forge/Alloy relational logic | Alloy users, complex relational queries |
| `SQLEvaluator` | Standard SQL | SQL-familiar users, complex aggregations |

---

## SGraphQueryEvaluator (SGQ)

The default evaluator. Designed for intuitive querying of graph-structured data.

### Initialization

```typescript
import { SGraphQueryEvaluator, AlloyDataInstance } from 'spytial-core';

const evaluator = new SGraphQueryEvaluator();
evaluator.initialize({ sourceData: myDataInstance });
```

### Query Syntax

**Selecting atoms by type:**

```
Person              // All atoms of type Person
Node                // All atoms of type Node
```

**Selecting specific atoms:**

```
Person0             // Atom with id "Person0"
Alice               // Atom with id "Alice"
```

**Selecting relation tuples:**

```
friends             // All tuples in the 'friends' relation
parent              // All tuples in the 'parent' relation
```

**Field access (navigation):**

```
Person.friends      // All atoms reachable via 'friends' from Person atoms
Alice.worksAt       // Companies where Alice works
```

**Filtering with join (binary selectors):**

```
Person->friends     // (source, target) pairs from Person via friends
Node->edges->Node   // Edges between nodes
```

### Examples

```typescript
// Get all Person atoms
evaluator.evaluate("Person").selectedAtoms();
// → ['Person0', 'Person1', 'Person2']

// Get friend relationships
evaluator.evaluate("friends").selectedTwoples();
// → [['Alice', 'Bob'], ['Bob', 'Charlie']]

// Navigate from a specific atom
evaluator.evaluate("Alice.friends").selectedAtoms();
// → ['Bob']
```

---

## ForgeEvaluator

Uses Forge/Alloy relational logic syntax. Ideal for users familiar with Alloy or Forge.

### Initialization

```typescript
import { ForgeEvaluator } from 'spytial-core';

const evaluator = new ForgeEvaluator();
evaluator.initialize({ sourceData: alloyXmlString }); // takes XML string
```

### Query Syntax

**Selecting atoms (sigs):**

```
Person              // All atoms in Person sig
univ                // All atoms (universe)
none                // Empty set
```

**Relational operators:**

```
Person.friends      // Relational join
friends.Person      // Reverse join
^parent             // Transitive closure
*parent             // Reflexive-transitive closure
~friends            // Transpose (reverse relation)
```

**Set operations:**

```
Person + Company    // Union
Person & Employee   // Intersection
Person - Manager    // Difference
```

**Filtering:**

```
friends & (Person -> Person)   // Friends between persons only
```

### Examples

```typescript
// Transitive closure — all ancestors
evaluator.evaluate("^parent").selectedTwoples();

// Symmetric closure — friends in both directions
evaluator.evaluate("friends + ~friends").selectedTwoples();
```

---

## SQLEvaluator

Uses standard SQL syntax with AlaSQL. Best for users comfortable with SQL and for complex aggregations.

### Initialization

```typescript
import { SQLEvaluator, AlloyDataInstance } from 'spytial-core';

const evaluator = new SQLEvaluator();
evaluator.initialize({ sourceData: myDataInstance });
```

### Database Schema

The SQLEvaluator creates tables from your data instance.

**Built-in tables** are prefixed with `_` to avoid collision with user-defined relations:

| Table | Columns | Description |
|-------|---------|-------------|
| `_atoms` | `id`, `type`, `label` | All atoms (type = most specific type) |
| `_atom_types` | `atom_id`, `type` | Junction table: all types per atom (includes inherited) |
| `_types` | `id`, `isBuiltin`, `hierarchy` | Type definitions |

**Relation tables:** for each relation in your data, a table is created:

| Relation Arity | Columns | Example |
|----------------|---------|---------|
| Unary (1) | `atom` | `selected(atom)` |
| Binary (2) | `src`, `tgt` | `friends(src, tgt)` |
| Ternary (3+) | `elem_0`, `elem_1`, ... | `assignment(elem_0, elem_1, elem_2)` |

### Important: Types are NOT tables

Unlike Forge where `Person` is a queryable set, in SQL:

```sql
-- ❌ This does NOT work
SELECT * FROM Person

-- ✅ This works — query atoms table with type filter
SELECT id FROM _atoms WHERE type = 'Person'
```

Relations ARE tables:

```sql
-- ✅ 'friends' is a relation table
SELECT * FROM friends
```

### Type Inheritance with `_atom_types`

The SQLEvaluator handles type inheritance (e.g., `sig Student extends Person`) via the `_atom_types` junction table.

| Table | Purpose | Use When |
|-------|---------|----------|
| `_atoms` | Each atom with its **most specific** type | You want exact type matches |
| `_atom_types` | Each atom with **all** its types (including inherited) | You want type hierarchy queries |

Given Alloy model:

```alloy
sig Person {}
sig Student extends Person {}
```

And atoms: `Person0` (type: Person), `Student0` (type: Student):

```sql
-- _atoms table: type = most specific only
SELECT id FROM _atoms WHERE type = 'Person'
-- Returns: Person0 (NOT Student0!)

-- _atom_types table: includes inherited types
SELECT DISTINCT atom_id FROM _atom_types WHERE type = 'Person'
-- Returns: Person0, Student0 (Student extends Person)
```

**Best practice for type queries (matching Forge/SGQ behavior):**

```sql
SELECT DISTINCT atom_id FROM _atom_types WHERE type = 'Person'

-- With full atom info (join with atoms table)
SELECT DISTINCT a.id, a.label
FROM _atoms a
JOIN _atom_types at ON a.id = at.atom_id
WHERE at.type = 'Person'
```

### Querying by ID vs Label

Atoms have both an `id` (unique identifier) and a `label` (display name). These may differ:

| Field | Purpose | Example |
|-------|---------|---------|
| `id` | Unique identifier, used in relations | `Person0`, `Node$1` |
| `label` | Human-readable display name | `Alice`, `Root Node` |

```sql
-- Find atom by exact ID
SELECT * FROM _atoms WHERE id = 'Person0'

-- Find atom by label (display name)
SELECT * FROM _atoms WHERE label = 'Alice'

-- Find atoms where label contains a substring
SELECT * FROM _atoms WHERE label LIKE '%Manager%'
```

### Binary Selectors (Edge Selection)

Binary selectors return pairs of atoms (for edges/arrows). In SQL, this means returning two columns.

```sql
-- Return (source, target) pairs
SELECT src, tgt FROM relation_name

-- Friends where source is a Person (equivalent to SGQ: Person->friends)
SELECT f.src, f.tgt
FROM friends f
JOIN _atom_types at ON f.src = at.atom_id
WHERE at.type = 'Person'

-- Friends between Persons only (equivalent to Forge: friends & (Person -> Person))
SELECT f.src, f.tgt
FROM friends f
JOIN _atom_types src_types ON f.src = src_types.atom_id
JOIN _atom_types tgt_types ON f.tgt = tgt_types.atom_id
WHERE src_types.type = 'Person' AND tgt_types.type = 'Person'

-- Self-loops only
SELECT src, tgt FROM edges WHERE src = tgt
```

Joining multiple relations:

```sql
-- Path through two relations: Person -> worksAt -> Company -> locatedIn -> City
SELECT w.src AS person, l.tgt AS city
FROM worksAt w
JOIN locatedIn l ON w.tgt = l.src
```

### Reserved Word Handling

SQL reserved words are automatically prefixed to avoid conflicts:

| Original Name | SQL Table Name |
|---------------|----------------|
| `select` | `rel_select` |
| `from` | `rel_from` |
| `order` | `rel_order` |

---

## Same Query, Three Evaluators

**Get all atoms of type "Person":**

| Evaluator | Query |
|-----------|-------|
| SGQ | `Person` |
| Forge | `Person` |
| SQL | `SELECT id FROM _atoms WHERE type = 'Person'` |

**Get all friend relationships:**

| Evaluator | Query |
|-----------|-------|
| SGQ | `friends` |
| Forge | `friends` |
| SQL | `SELECT src, tgt FROM friends` |

**Get friends of Alice:**

| Evaluator | Query |
|-----------|-------|
| SGQ | `Alice.friends` |
| Forge | `Alice.friends` |
| SQL | `SELECT tgt FROM friends WHERE src = 'Alice'` |

**Get all ancestors (transitive parent):**

| Evaluator | Query |
|-----------|-------|
| SGQ | Not directly supported |
| Forge | `^parent` |
| SQL | Requires recursive CTE (complex) |

---

## Choosing an Evaluator

- **SGQ** — simple, intuitive syntax; straightforward type/relation selections; general-purpose visualization.
- **Forge** — Alloy/Forge models; transitive closure (`^`) or transpose (`~`); full relational algebra.
- **SQL** — comfortable with SQL; aggregations (COUNT, SUM); complex JOINs; SQL-familiar audience.

---

## Result Interface

All evaluators return results implementing `IEvaluatorResult`:

```typescript
interface IEvaluatorResult {
  isError(): boolean;
  getError(): { message: string; code?: string } | undefined;
  noResult(): boolean;
  selectedAtoms(): string[];           // for node selection
  selectedTwoples(): [string, string][]; // for edge selection
  getRawResult(): unknown;
}
```

```typescript
const result = evaluator.evaluate("Person");

if (result.isError()) {
  console.error(result.getError()?.message);
  return;
}

const atoms = result.selectedAtoms();
console.log(`Found ${atoms.length} Person atoms:`, atoms);
```

---

## Using Evaluators in CnD Specs

Evaluators power the selectors in YAML specs:

```yaml
constraints:
  - orientation:
      selector: Person->worksAt->Company  # Evaluated by your configured evaluator
      directions: [above]

directives:
  - atomColor:
      selector: Person.friends            # Also evaluated
      value: blue
```

The layout system uses whichever evaluator you've configured to interpret these selectors.
