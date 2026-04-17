# Selector Synthesis

CnD can auto-generate selector expressions from examples. Instead of writing a selector by hand, you give a set of atoms (or pairs) and the synthesizer finds a selector expression that matches exactly those.

The synthesizer uses a CEGIS-style (Counter-Example Guided Inductive Synthesis) approach — exploring the expression grammar (identifiers, set operations, joins, closures) until it finds an expression that matches all examples.

## Evaluator Compatibility

Synthesis only works with **`SGraphQueryEvaluator`** — it generates expressions in the simple-graph-query language.

- Supported: `SGraphQueryEvaluator`
- Not supported: `ForgeEvaluator` (Forge has its own expression language)

Check compatibility before using:

```typescript
import { isSynthesisSupported, SGraphQueryEvaluator } from 'spytial-core';

const evaluator = new SGraphQueryEvaluator();
evaluator.initialize({ sourceData: myDataInstance });

if (isSynthesisSupported(evaluator)) {
  const selector = synthesizeAtomSelector([...]);
} else {
  // Fall back to manual selector entry
}
```

## API

### `synthesizeAtomSelector(examples, maxDepth?)`

Generate a unary selector (for single atoms) from examples.

```typescript
import { synthesizeAtomSelector } from 'spytial-core';

const selector = synthesizeAtomSelector([
  { atoms: [aliceAtom, bobAtom],       dataInstance: instance1 },
  { atoms: [charlieAtom, dianaAtom],   dataInstance: instance2 },
], 3); // maxDepth = 3

// Returns e.g. "Student" or "Person & Adult"
```

**Use cases:** alignment constraints ("align left for all Students"), color directives ("color red for all Managers"), size directives.

### `synthesizeBinarySelector(examples, maxDepth?)`

Generate a binary relation selector (for atom pairs) from examples.

```typescript
import { synthesizeBinarySelector } from 'spytial-core';

const selector = synthesizeBinarySelector([
  { pairs: [[alice, bob], [charlie, diana]], dataInstance: instance1 },
], 3);

// Returns e.g. "friend" or "coworker & SameOffice"
```

**Use cases:** orientation constraints; deriving edge relations from visual placement.

### `synthesizeAtomSelectorWithExplanation(examples, maxDepth?)`

Same, but returns detailed provenance showing how subexpressions evaluated — useful for debugging and for showing users *why* a selector matched.

```typescript
import { synthesizeAtomSelectorWithExplanation } from 'spytial-core';

const result = synthesizeAtomSelectorWithExplanation([
  { atoms: [alice, bob], dataInstance: instance }
]);

console.log(result.expression);      // "Student & Adult"
console.log(result.examples[0].why); // provenance tree
// {
//   kind: 'intersection',
//   expression: '(Student & Adult)',
//   result: Set { 'alice', 'bob' },
//   children: [
//     { kind: 'identifier', expression: 'Student', result: Set { 'alice', 'bob', 'charlie' } },
//     { kind: 'identifier', expression: 'Adult',   result: Set { 'alice', 'bob', 'diana' } }
//   ]
// }
```

## Helpers

These wrap synthesis + CnD directive string generation.

```typescript
import {
  synthesizeBinarySelector,
  createOrientationConstraint,
  synthesizeAtomSelector,
  createAlignmentConstraint,
  createColorDirective,
} from 'spytial-core';

// Orientation
const bsel = synthesizeBinarySelector([{ pairs: [[a, b]], dataInstance: inst }]);
createOrientationConstraint(bsel, ['right', 'below']);
// "right(friend)\nbelow(friend)"

// Alignment
const asel = synthesizeAtomSelector([{ atoms: [a, b, c], dataInstance: inst }]);
createAlignmentConstraint(asel, 'left');
// "align left(Student)"

// Color
const csel = synthesizeAtomSelector([{ atoms: [manager1, manager2], dataInstance: inst }]);
createColorDirective(csel, '#ff0000');
// "color #ff0000(Manager)"
```

## Interactive Workflow

```typescript
// User selects nodes in the graph
const selectedNodes = [node1, node2, node3];
const selectedAtoms = selectedNodes.map(n =>
  dataInstance.getAtoms().find(a => a.id === n.id)
);

try {
  const result = synthesizeAtomSelectorWithExplanation([
    { atoms: selectedAtoms, dataInstance }
  ]);

  console.log(`Generated selector: ${result.expression}`);

  // Show user what the selector matches
  const evaluator = new SGraphQueryEvaluator();
  evaluator.initialize({ sourceData: dataInstance });
  const matches = evaluator.evaluate(result.expression).selectedAtoms();
  console.log(`Selector matches: ${matches.join(', ')}`);

  // User confirms — add to spec
  const newSpec = `${existingSpec}\ncolor blue(${result.expression})`;

} catch (error) {
  if (error instanceof SelectorSynthesisError) {
    console.error('Could not synthesize:', error.message);
    // Fall back to manual entry
  }
}
```

## Parameters

### `maxDepth` (default: 3)

Controls the maximum complexity of generated expressions:

- `1` — only base identifiers (e.g. `Person`)
- `2` — simple operations (e.g. `Person + Student`, `^parent`)
- `3` — complex expressions (e.g. `(Person & Adult) - Manager`)
- Higher — more complex but slower synthesis

### Performance

- Synthesis time grows with `maxDepth` and the number of identifiers.
- For large schemas, consider filtering the available identifiers.
- Use explanation mode when synthesis fails — it shows which subexpressions evaluated to what.
- Cache synthesized selectors for repeated patterns.

## Error Handling

```typescript
import { SelectorSynthesisError } from 'spytial-core';

try {
  const selector = synthesizeAtomSelector(examples);
} catch (error) {
  if (error instanceof SelectorSynthesisError) {
    // Common causes:
    //   - No shared identifiers across examples
    //   - Examples are contradictory
    //   - maxDepth too small for required complexity
    console.error('Synthesis failed:', error.message);
  }
}
```
